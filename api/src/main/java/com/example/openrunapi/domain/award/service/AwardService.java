package com.example.openrunapi.domain.award.service;

import com.example.openrunapi.domain.award.model.AwardWinner;
import com.example.openrunapi.domain.award.model.dto.AwardRankingEntry;
import com.example.openrunapi.domain.award.model.dto.AwardRankingResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnerResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnersResponse;
import com.example.openrunapi.domain.award.model.dto.CumulativeAchievementResponse;
import com.example.openrunapi.domain.award.model.dto.SaveAwardWinnerRequest;
import com.example.openrunapi.domain.award.repository.AwardWinnerRepository;
import com.example.openrunapi.domain.club.model.AwardType;
import com.example.openrunapi.domain.club.model.ClubPolicy;
import com.example.openrunapi.domain.club.model.RankingPeriod;
import com.example.openrunapi.domain.club.model.dto.RankingCustomSeason;
import com.example.openrunapi.domain.club.repository.ClubPolicyRepository;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AwardService {

    @PersistenceContext
    private EntityManager em;

    private final ClubPolicyRepository clubPolicyRepository;
    private final UserRepository userRepository;
    private final AwardWinnerRepository awardWinnerRepository;
    private final ObjectMapper objectMapper;

    // 승점 정책
    private static final int WIN_POINTS = 3;
    private static final int DRAW_POINTS = 1;
    private static final int LOSS_POINTS = 0;

    /**
     * 어워드 랭킹 조회
     * @param clubId 클럽 ID
     * @param type 어워드 타입 (null이면 활성화된 모든 타입 반환)
     * @param startDate 조회 시작일 (null이면 현재 정산 주기 기준)
     * @param endDate 조회 종료일 (null이면 현재 정산 주기 기준)
     * @param limit 조회 개수 (기본 10)
     */
    public List<AwardRankingResponse> getAwardRankings(
            Long clubId,
            AwardType type,
            LocalDate startDate,
            LocalDate endDate,
            Integer limit
    ) {
        // 클럽 정책 조회
        ClubPolicy policy = clubPolicyRepository.findByClubId(clubId)
                .orElseThrow(() -> new IllegalArgumentException("클럽 정책을 찾을 수 없습니다."));

        // 기간 계산 (랭킹 주기 기준으로 통일)
        LocalDate[] periodDates = calculatePeriodDates(policy.getRankingPeriod(), policy.getRankingCustomSeasons(), startDate, endDate);
        LocalDate actualStartDate = periodDates[0];
        LocalDate actualEndDate = periodDates[1];

        int actualLimit = limit != null && limit > 0 ? limit : 10;

        List<AwardRankingResponse> results = new ArrayList<>();

        // 특정 타입만 요청한 경우
        if (type != null) {
            if (isAwardTypeEnabled(policy, type)) {
                results.add(getRankingForType(clubId, type, policy.getRankingPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
        } else {
            // 활성화된 모든 타입 조회
            if (Boolean.TRUE.equals(policy.getAwardAttendanceEnabled())) {
                results.add(getRankingForType(clubId, AwardType.ATTENDANCE, policy.getRankingPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
            if (Boolean.TRUE.equals(policy.getAwardPointsEnabled())) {
                results.add(getRankingForType(clubId, AwardType.POINTS, policy.getRankingPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
            if (Boolean.TRUE.equals(policy.getAwardBookingEnabled())) {
                results.add(getRankingForType(clubId, AwardType.BOOKING, policy.getRankingPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
        }

        return results;
    }

    /**
     * 특정 어워드 타입의 랭킹 조회
     */
    private AwardRankingResponse getRankingForType(
            Long clubId,
            AwardType type,
            RankingPeriod period,
            LocalDate startDate,
            LocalDate endDate,
            int limit
    ) {
        List<AwardRankingEntry> rankings = switch (type) {
            case ATTENDANCE -> getAttendanceRanking(clubId, startDate, endDate, limit);
            case POINTS -> getPointsRanking(clubId, startDate, endDate, limit);
            case BOOKING -> getBookingRanking(clubId, startDate, endDate, limit);
        };

        // 실시간 랭킹이 비어있으면 확정 수상자로 fallback
        if (rankings.isEmpty()) {
            Optional<AwardWinner> savedWinner = awardWinnerRepository
                    .findByClubIdAndAwardTypeAndPeriodStartAndPeriodEnd(clubId, type, startDate, endDate);
            if (savedWinner.isPresent()) {
                AwardWinner winner = savedWinner.get();
                String userName = userRepository.findById(winner.getUserId())
                        .map(u -> u.getName())
                        .orElse("알 수 없음");
                rankings = List.of(AwardRankingEntry.builder()
                        .rank(1)
                        .userId(winner.getUserId())
                        .userName(userName)
                        .value(winner.getValue())
                        .build());
            }
        }

        return AwardRankingResponse.builder()
                .type(type)
                .period(period)
                .startDate(startDate)
                .endDate(endDate)
                .rankings(rankings)
                .build();
    }

    /**
     * 다참(ATTENDANCE) 랭킹 조회 - 참여 경기 수
     * - 기록 탭(ScoreboardService)의 "경기수"와 동일한 기준(Match 테이블)을 사용
     */
    private List<AwardRankingEntry> getAttendanceRanking(Long clubId, LocalDate startDate, LocalDate endDate, int limit) {
        List<Match> matches = fetchCompletedMatches(clubId, startDate, endDate);

        // 선수별 참여 경기 수 계산
        Map<Long, Long> matchCountByUser = new HashMap<>();
        for (Match match : matches) {
            for (Long playerId : getAllMatchPlayers(match)) {
                matchCountByUser.merge(playerId, 1L, Long::sum);
            }
        }

        return rankTopEntries(matchCountByUser, limit);
    }

    /**
     * 다승점(POINTS) 랭킹 조회 - 경기 승점 합계
     */
    private List<AwardRankingEntry> getPointsRanking(Long clubId, LocalDate startDate, LocalDate endDate, int limit) {
        List<Match> matches = fetchCompletedMatches(clubId, startDate, endDate);

        // 선수별 승점 계산
        Map<Long, Long> pointsByUser = new HashMap<>();
        for (Match match : matches) {
            calculateMatchPoints(match, pointsByUser);
        }

        return rankTopEntries(pointsByUser, limit);
    }

    /**
     * 기간 내 완료된 경기 조회 (다참/다승점 랭킹 공용)
     */
    private List<Match> fetchCompletedMatches(Long clubId, LocalDate startDate, LocalDate endDate) {
        String jpql = """
            SELECT m FROM Match m
            WHERE m.clubId = :clubId
              AND m.playedAt >= :startDateTime
              AND m.playedAt < :endDateTime
              AND m.result IS NOT NULL
            """;

        return em.createQuery(jpql, Match.class)
                .setParameter("clubId", clubId)
                .setParameter("startDateTime", startDate.atStartOfDay())
                .setParameter("endDateTime", endDate.plusDays(1).atStartOfDay())
                .getResultList();
    }

    /**
     * 경기에 참여한 모든 선수 ID 반환 (양 팀, null 제외)
     */
    private List<Long> getAllMatchPlayers(Match match) {
        List<Long> players = new ArrayList<>(getTeamPlayers(match.getTeamAPlayer1Id(), match.getTeamAPlayer2Id()));
        players.addAll(getTeamPlayers(match.getTeamBPlayer1Id(), match.getTeamBPlayer2Id()));
        return players;
    }

    /**
     * 사용자별 집계값(Map)을 상위 limit명 랭킹 엔트리로 변환 (동점 처리 포함)
     */
    private List<AwardRankingEntry> rankTopEntries(Map<Long, Long> valueByUser, int limit) {
        List<Map.Entry<Long, Long>> topEntries = valueByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .toList();

        List<Long> userIds = topEntries.stream().map(Map.Entry::getKey).toList();
        Map<Long, String> userNames = getUserNames(userIds);

        List<AwardRankingEntry> rankings = new ArrayList<>();
        int rank = 1;
        Long prevValue = null;
        int sameRankCount = 0;

        for (Map.Entry<Long, Long> entry : topEntries) {
            Long userId = entry.getKey();
            Long value = entry.getValue();

            // 동점 처리
            if (prevValue != null && !prevValue.equals(value)) {
                rank += sameRankCount;
                sameRankCount = 1;
            } else {
                sameRankCount++;
            }
            prevValue = value;

            rankings.add(AwardRankingEntry.builder()
                    .rank(rank)
                    .userId(userId)
                    .userName(userNames.getOrDefault(userId, "알 수 없음"))
                    .value(value)
                    .build());
        }

        return rankings;
    }

    /**
     * 예약왕(BOOKING) 랭킹 조회 - 일정 예약 횟수
     */
    private List<AwardRankingEntry> getBookingRanking(Long clubId, LocalDate startDate, LocalDate endDate, int limit) {
        String jpql = """
            SELECT s.reservedByUserId, u.name, COUNT(s.id) as cnt
            FROM Schedule s
            JOIN User u ON s.reservedByUserId = u.id
            WHERE s.clubId = :clubId
              AND s.scheduledAt >= :startDateTime
              AND s.scheduledAt < :endDateTime
              AND s.reservedByUserId IS NOT NULL
            GROUP BY s.reservedByUserId, u.name
            ORDER BY cnt DESC, u.name ASC
            """;

        List<Object[]> results = em.createQuery(jpql, Object[].class)
                .setParameter("clubId", clubId)
                .setParameter("startDateTime", startDate.atStartOfDay())
                .setParameter("endDateTime", endDate.plusDays(1).atStartOfDay())
                .setMaxResults(limit)
                .getResultList();

        return buildRankingEntries(results);
    }

    /**
     * 경기 결과에 따른 승점 계산
     */
    private void calculateMatchPoints(Match match, Map<Long, Long> pointsByUser) {
        if (match.getResult() == null) return;

        List<Long> teamAPlayers = getTeamPlayers(match.getTeamAPlayer1Id(), match.getTeamAPlayer2Id());
        List<Long> teamBPlayers = getTeamPlayers(match.getTeamBPlayer1Id(), match.getTeamBPlayer2Id());

        int teamAPoints;
        int teamBPoints;

        switch (match.getResult()) {
            case TEAM_A_WIN -> {
                teamAPoints = WIN_POINTS;
                teamBPoints = LOSS_POINTS;
            }
            case TEAM_B_WIN -> {
                teamAPoints = LOSS_POINTS;
                teamBPoints = WIN_POINTS;
            }
            case DRAW -> {
                teamAPoints = DRAW_POINTS;
                teamBPoints = DRAW_POINTS;
            }
            default -> {
                return;
            }
        }

        for (Long playerId : teamAPlayers) {
            pointsByUser.merge(playerId, (long) teamAPoints, Long::sum);
        }
        for (Long playerId : teamBPlayers) {
            pointsByUser.merge(playerId, (long) teamBPoints, Long::sum);
        }
    }

    /**
     * 팀 선수 ID 목록 반환 (null 제외)
     */
    private List<Long> getTeamPlayers(Long player1Id, Long player2Id) {
        List<Long> players = new ArrayList<>();
        if (player1Id != null) players.add(player1Id);
        if (player2Id != null) players.add(player2Id);
        return players;
    }

    /**
     * 사용자 ID 목록으로 이름 맵 조회
     */
    private Map<Long, String> getUserNames(List<Long> userIds) {
        if (userIds.isEmpty()) return Collections.emptyMap();

        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        u -> u.getId(),
                        u -> u.getName()
                ));
    }

    /**
     * 쿼리 결과를 랭킹 엔트리 목록으로 변환
     */
    private List<AwardRankingEntry> buildRankingEntries(List<Object[]> results) {
        List<AwardRankingEntry> rankings = new ArrayList<>();
        int rank = 1;
        Long prevValue = null;
        int sameRankCount = 0;

        for (Object[] row : results) {
            Long userId = (Long) row[0];
            String userName = (String) row[1];
            Long value = (Long) row[2];

            // 동점 처리
            if (prevValue != null && !prevValue.equals(value)) {
                rank += sameRankCount;
                sameRankCount = 1;
            } else {
                sameRankCount++;
            }
            prevValue = value;

            rankings.add(AwardRankingEntry.builder()
                    .rank(rank)
                    .userId(userId)
                    .userName(userName)
                    .value(value)
                    .build());
        }

        return rankings;
    }

    /**
     * 랭킹 주기에 따른 기간 목록 계산 (index 0 = 현재 진행 중인 기간, 이후 과거 순)
     * - 프론트 awardService.generateRankingPeriodOptions()와 동일한 규칙을 서버에서도 재현
     */
    private List<LocalDate[]> computePeriodBoundaries(RankingPeriod period, String customSeasonsJson, int count) {
        List<LocalDate[]> result = new ArrayList<>();
        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        switch (period) {
            case MONTHLY -> {
                int year = currentYear;
                int month = currentMonth;
                for (int i = 0; i < count; i++) {
                    LocalDate start = LocalDate.of(year, month, 1);
                    result.add(new LocalDate[]{start, start.withDayOfMonth(start.lengthOfMonth())});
                    month--;
                    if (month < 1) {
                        month = 12;
                        year--;
                    }
                }
            }
            case QUARTERLY -> {
                int q = (currentMonth - 1) / 3 + 1;
                int year = currentYear;
                for (int i = 0; i < count; i++) {
                    int startMonth = (q - 1) * 3 + 1;
                    int endMonth = q * 3;
                    LocalDate end = LocalDate.of(year, endMonth, 1);
                    result.add(new LocalDate[]{LocalDate.of(year, startMonth, 1), end.withDayOfMonth(end.lengthOfMonth())});
                    q--;
                    if (q < 1) {
                        q = 4;
                        year--;
                    }
                }
            }
            case HALF_YEAR -> {
                boolean first = currentMonth <= 6;
                int year = currentYear;
                for (int i = 0; i < count; i++) {
                    if (first) {
                        result.add(new LocalDate[]{LocalDate.of(year, 1, 1), LocalDate.of(year, 6, 30)});
                        first = false;
                        year--;
                    } else {
                        result.add(new LocalDate[]{LocalDate.of(year, 7, 1), LocalDate.of(year, 12, 31)});
                        first = true;
                    }
                }
            }
            case YEARLY -> {
                for (int i = 0; i < count; i++) {
                    int year = currentYear - i;
                    result.add(new LocalDate[]{LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)});
                }
            }
            case CUSTOM -> result.addAll(computeCustomSeasonBoundaries(customSeasonsJson, count, currentYear, currentMonth));
        }

        return result;
    }

    /**
     * 커스텀 시즌 기반 기간 목록 계산
     * - 시즌 미설정 시 연간으로 폴백
     */
    private List<LocalDate[]> computeCustomSeasonBoundaries(String customSeasonsJson, int count, int currentYear, int currentMonth) {
        List<RankingCustomSeason> seasons = parseCustomSeasons(customSeasonsJson);
        List<LocalDate[]> result = new ArrayList<>();

        if (seasons.isEmpty()) {
            for (int i = 0; i < count; i++) {
                int year = currentYear - i;
                result.add(new LocalDate[]{LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)});
            }
            return result;
        }

        int currentIdx = 0;
        for (int i = 0; i < seasons.size(); i++) {
            RankingCustomSeason s = seasons.get(i);
            boolean inSeason = s.startMonth() <= s.endMonth()
                    ? (currentMonth >= s.startMonth() && currentMonth <= s.endMonth())
                    : (currentMonth >= s.startMonth() || currentMonth <= s.endMonth());
            if (inSeason) {
                currentIdx = i;
                break;
            }
        }

        RankingCustomSeason currentSeason = seasons.get(currentIdx);
        int year = currentYear;
        // 현재 시즌이 연도 경계를 넘는 시즌이고, 아직 그 경계를 넘기 전(예: 12월)이라면
        // "이 시즌은 내년까지 이어진다" - year 기준을 한 해 앞으로 당겨서 이후 로직을 단일 규칙으로 통일
        if (currentSeason.startMonth() > currentSeason.endMonth() && currentMonth > currentSeason.endMonth()) {
            year = currentYear + 1;
        }

        int idx = currentIdx;
        for (int i = 0; i < count; i++) {
            RankingCustomSeason season = seasons.get(idx);
            boolean wrapAround = season.startMonth() > season.endMonth();

            // 연도 경계를 넘는 시즌은 항상 "작년 시작 ~ 올해(year) 종료"로 통일
            int startYear = wrapAround ? year - 1 : year;
            int endYear = year;

            LocalDate end = LocalDate.of(endYear, season.endMonth(), 1);
            result.add(new LocalDate[]{
                    LocalDate.of(startYear, season.startMonth(), 1),
                    end.withDayOfMonth(end.lengthOfMonth())
            });

            idx--;
            if (idx < 0) {
                idx = seasons.size() - 1;
                year--;
            }
        }

        return result;
    }

    private List<RankingCustomSeason> parseCustomSeasons(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<RankingCustomSeason>>() {});
        } catch (JsonProcessingException e) {
            log.warn("커스텀 시즌 JSON 파싱 실패: {}", json, e);
            return List.of();
        }
    }

    /**
     * 랭킹 주기에 따른 현재 기간 계산
     */
    private LocalDate[] calculatePeriodDates(RankingPeriod period, String customSeasonsJson, LocalDate startDate, LocalDate endDate) {
        // 명시적으로 기간이 지정된 경우
        if (startDate != null && endDate != null) {
            return new LocalDate[]{startDate, endDate};
        }
        return computePeriodBoundaries(period, customSeasonsJson, 1).get(0);
    }

    /**
     * 직전 완료 기간 계산 (수상자 뱃지 표시용)
     */
    private LocalDate[] calculatePreviousPeriodDates(RankingPeriod period, String customSeasonsJson) {
        return computePeriodBoundaries(period, customSeasonsJson, 2).get(1);
    }

    /**
     * 어워드 타입 활성화 여부 확인
     */
    private boolean isAwardTypeEnabled(ClubPolicy policy, AwardType type) {
        return switch (type) {
            case ATTENDANCE -> Boolean.TRUE.equals(policy.getAwardAttendanceEnabled());
            case POINTS -> Boolean.TRUE.equals(policy.getAwardPointsEnabled());
            case BOOKING -> Boolean.TRUE.equals(policy.getAwardBookingEnabled());
        };
    }

    /**
     * 직전 완료 기간의 어워드 수상자(1등) 조회
     * 크라운 배지 표시에 사용 (확정된 수상자만 표시)
     */
    public AwardWinnersResponse getCurrentWinners(Long clubId) {
        // 클럽 정책 조회
        ClubPolicy policy = clubPolicyRepository.findByClubId(clubId)
                .orElseThrow(() -> new IllegalArgumentException("클럽 정책을 찾을 수 없습니다."));

        // 직전 완료 기간 계산 (수상자 뱃지용)
        LocalDate[] periodDates = calculatePreviousPeriodDates(policy.getRankingPeriod(), policy.getRankingCustomSeasons());
        LocalDate startDate = periodDates[0];
        LocalDate endDate = periodDates[1];

        Set<Long> winnerUserIds = new HashSet<>();
        List<AwardWinnersResponse.WinnerDetail> winners = new ArrayList<>();

        // 활성화된 어워드 타입별 1등 조회
        if (Boolean.TRUE.equals(policy.getAwardAttendanceEnabled())) {
            addWinnerIfExists(clubId, AwardType.ATTENDANCE, startDate, endDate, winnerUserIds, winners);
        }
        if (Boolean.TRUE.equals(policy.getAwardPointsEnabled())) {
            addWinnerIfExists(clubId, AwardType.POINTS, startDate, endDate, winnerUserIds, winners);
        }
        if (Boolean.TRUE.equals(policy.getAwardBookingEnabled())) {
            addWinnerIfExists(clubId, AwardType.BOOKING, startDate, endDate, winnerUserIds, winners);
        }

        return AwardWinnersResponse.builder()
                .period(policy.getRankingPeriod())
                .startDate(startDate)
                .endDate(endDate)
                .winnerUserIds(winnerUserIds)
                .winners(winners)
                .build();
    }

    /**
     * 특정 어워드 타입의 1등을 결과에 추가
     * award_winner 테이블 우선, 없으면 실시간 집계
     */
    private void addWinnerIfExists(
            Long clubId,
            AwardType type,
            LocalDate startDate,
            LocalDate endDate,
            Set<Long> winnerUserIds,
            List<AwardWinnersResponse.WinnerDetail> winners
    ) {
        // 1. award_winner 테이블에서 먼저 조회
        Optional<AwardWinner> savedWinner = awardWinnerRepository
                .findByClubIdAndAwardTypeAndPeriodStartAndPeriodEnd(clubId, type, startDate, endDate);

        // 클럽 관리에서 직접 지정한 수상자만 표시 (실시간 집계 폴백 제거)
        if (savedWinner.isPresent()) {
            AwardWinner winner = savedWinner.get();
            String userName = userRepository.findById(winner.getUserId())
                    .map(u -> u.getName())
                    .orElse("알 수 없음");

            winnerUserIds.add(winner.getUserId());
            winners.add(AwardWinnersResponse.WinnerDetail.builder()
                    .type(type)
                    .userId(winner.getUserId())
                    .userName(userName)
                    .value(winner.getValue())
                    .build());
        }
    }

    // ==================== 수상자 관리 (Admin용) ====================

    /**
     * 수상자 저장 (수동 입력)
     */
    @Transactional
    public AwardWinnerResponse saveAwardWinner(Long clubId, SaveAwardWinnerRequest request, Long createdBy) {
        // 기존 수상자 삭제 (덮어쓰기)
        awardWinnerRepository.deleteByClubIdAndAwardTypeAndPeriodStartAndPeriodEnd(
                clubId, request.getAwardType(), request.getPeriodStart(), request.getPeriodEnd()
        );

        AwardWinner winner = AwardWinner.builder()
                .clubId(clubId)
                .userId(request.getUserId())
                .awardType(request.getAwardType())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .value(request.getValue())
                .isManual(true)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        AwardWinner saved = awardWinnerRepository.save(winner);

        String userName = userRepository.findById(saved.getUserId())
                .map(u -> u.getName())
                .orElse("알 수 없음");

        return AwardWinnerResponse.from(saved, userName);
    }

    /**
     * 클럽의 특정 기간 수상자 목록 조회
     */
    public List<AwardWinnerResponse> getAwardWinners(Long clubId, LocalDate periodStart, LocalDate periodEnd) {
        List<AwardWinner> winners = awardWinnerRepository
                .findByClubIdAndPeriodStartAndPeriodEnd(clubId, periodStart, periodEnd);

        List<Long> userIds = winners.stream().map(AwardWinner::getUserId).toList();
        Map<Long, String> userNames = getUserNames(userIds);

        return winners.stream()
                .map(w -> AwardWinnerResponse.from(w, userNames.getOrDefault(w.getUserId(), "알 수 없음")))
                .toList();
    }

    /**
     * 클럽의 모든 수상 기록 조회
     */
    public List<AwardWinnerResponse> getAllAwardWinners(Long clubId) {
        List<AwardWinner> winners = awardWinnerRepository.findByClubIdOrderByPeriodStartDesc(clubId);

        List<Long> userIds = winners.stream().map(AwardWinner::getUserId).toList();
        Map<Long, String> userNames = getUserNames(userIds);

        return winners.stream()
                .map(w -> AwardWinnerResponse.from(w, userNames.getOrDefault(w.getUserId(), "알 수 없음")))
                .toList();
    }

    /**
     * 수상자 수정
     */
    @Transactional
    public AwardWinnerResponse updateAwardWinner(Long id, Long userId, Long value, Long updatedBy) {
        AwardWinner winner = awardWinnerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("수상자를 찾을 수 없습니다. id=" + id));

        winner.setUserId(userId);
        winner.setValue(value);
        winner.setCreatedBy(updatedBy);  // 수정자로 갱신
        winner.setCreatedAt(LocalDateTime.now());  // 수정 시간으로 갱신

        String userName = userRepository.findById(userId)
                .map(u -> u.getName())
                .orElse("알 수 없음");

        return AwardWinnerResponse.from(winner, userName);
    }

    /**
     * 수상자 삭제
     */
    @Transactional
    public void deleteAwardWinner(Long id) {
        awardWinnerRepository.deleteById(id);
    }

    // ==================== 누적 업적 시스템 ====================

    /**
     * 클럽 내 전체 멤버의 누적 업적 조회
     * - 어워드 타입별 수상 횟수
     * - 대표 업적 (가장 높은 티어의 업적)
     */
    public CumulativeAchievementResponse getCumulativeAchievements(Long clubId) {
        // 1. 타입별 수상 횟수 집계
        List<Object[]> rawCounts = awardWinnerRepository.countAwardsByUserAndType(clubId);

        // 2. 사용자별로 그룹화
        Map<Long, Map<AwardType, Integer>> userAwardCounts = new LinkedHashMap<>();
        for (Object[] row : rawCounts) {
            Long userId = (Long) row[0];
            AwardType awardType = (AwardType) row[1];
            int count = ((Long) row[2]).intValue();

            userAwardCounts
                    .computeIfAbsent(userId, k -> new EnumMap<>(AwardType.class))
                    .put(awardType, count);
        }

        // 3. 사용자 이름 조회
        List<Long> userIds = new ArrayList<>(userAwardCounts.keySet());
        Map<Long, String> userNames = getUserNames(userIds);

        // 4. MemberAchievement 목록 생성
        List<CumulativeAchievementResponse.MemberAchievement> members = new ArrayList<>();
        for (Map.Entry<Long, Map<AwardType, Integer>> entry : userAwardCounts.entrySet()) {
            Long userId = entry.getKey();
            Map<AwardType, Integer> awardCounts = entry.getValue();

            // 대표 업적 결정 (가장 높은 티어)
            AwardType primaryAward = null;
            int primaryTier = 0;

            for (Map.Entry<AwardType, Integer> awardEntry : awardCounts.entrySet()) {
                int tier = calculateTier(awardEntry.getValue());
                if (tier > primaryTier) {
                    primaryTier = tier;
                    primaryAward = awardEntry.getKey();
                }
            }

            members.add(CumulativeAchievementResponse.MemberAchievement.builder()
                    .userId(userId)
                    .userName(userNames.getOrDefault(userId, "알 수 없음"))
                    .awardCounts(awardCounts)
                    .primaryAward(primaryAward)
                    .primaryTier(primaryTier)
                    .build());
        }

        // 5. 대표 티어 순으로 정렬 (높은 티어가 먼저)
        members.sort((a, b) -> {
            int tierCompare = Integer.compare(b.getPrimaryTier(), a.getPrimaryTier());
            if (tierCompare != 0) return tierCompare;
            // 같은 티어면 이름순
            return a.getUserName().compareTo(b.getUserName());
        });

        return CumulativeAchievementResponse.builder()
                .members(members)
                .build();
    }

    /**
     * 특정 사용자의 상세 업적 조회
     */
    public List<AwardWinnerResponse> getUserAchievements(Long clubId, Long userId) {
        List<AwardWinner> winners = awardWinnerRepository.findByClubIdAndUserId(clubId, userId);

        return winners.stream()
                .map(w -> {
                    String userName = userRepository.findById(w.getUserId())
                            .map(u -> u.getName())
                            .orElse("알 수 없음");
                    return AwardWinnerResponse.from(w, userName);
                })
                .toList();
    }

    /**
     * 수상 횟수에 따른 티어 계산
     * 1회 = 브론즈 (Tier 1)
     * 2회 = 실버 (Tier 2)
     * 3회 = 골드 (Tier 3)
     * 4회 = 플래티넘 (Tier 4)
     * 5회+ = 레인보우 (Tier 5)
     */
    private int calculateTier(int awardCount) {
        if (awardCount <= 0) return 0;
        if (awardCount >= 5) return 5;
        return awardCount;
    }

}
