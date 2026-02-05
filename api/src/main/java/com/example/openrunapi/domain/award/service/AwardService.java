package com.example.openrunapi.domain.award.service;

import com.example.openrunapi.domain.award.model.AwardWinner;
import com.example.openrunapi.domain.award.model.dto.AwardRankingEntry;
import com.example.openrunapi.domain.award.model.dto.AwardRankingResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnerResponse;
import com.example.openrunapi.domain.award.model.dto.AwardWinnersResponse;
import com.example.openrunapi.domain.award.model.dto.SaveAwardWinnerRequest;
import com.example.openrunapi.domain.award.repository.AwardWinnerRepository;
import com.example.openrunapi.domain.club.model.AwardPeriod;
import com.example.openrunapi.domain.club.model.AwardType;
import com.example.openrunapi.domain.club.model.ClubPolicy;
import com.example.openrunapi.domain.club.repository.ClubPolicyRepository;
import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AwardService {

    @PersistenceContext
    private EntityManager em;

    private final ClubPolicyRepository clubPolicyRepository;
    private final UserRepository userRepository;
    private final AwardWinnerRepository awardWinnerRepository;

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

        // 기간 계산
        LocalDate[] periodDates = calculatePeriodDates(policy.getAwardPeriod(), startDate, endDate);
        LocalDate actualStartDate = periodDates[0];
        LocalDate actualEndDate = periodDates[1];

        int actualLimit = limit != null && limit > 0 ? limit : 10;

        List<AwardRankingResponse> results = new ArrayList<>();

        // 특정 타입만 요청한 경우
        if (type != null) {
            if (isAwardTypeEnabled(policy, type)) {
                results.add(getRankingForType(clubId, type, policy.getAwardPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
        } else {
            // 활성화된 모든 타입 조회
            if (Boolean.TRUE.equals(policy.getAwardAttendanceEnabled())) {
                results.add(getRankingForType(clubId, AwardType.ATTENDANCE, policy.getAwardPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
            if (Boolean.TRUE.equals(policy.getAwardPointsEnabled())) {
                results.add(getRankingForType(clubId, AwardType.POINTS, policy.getAwardPeriod(), actualStartDate, actualEndDate, actualLimit));
            }
            if (Boolean.TRUE.equals(policy.getAwardBookingEnabled())) {
                results.add(getRankingForType(clubId, AwardType.BOOKING, policy.getAwardPeriod(), actualStartDate, actualEndDate, actualLimit));
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
            AwardPeriod period,
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
     * 다참(ATTENDANCE) 랭킹 조회 - 확정된 일정 참가 횟수
     */
    private List<AwardRankingEntry> getAttendanceRanking(Long clubId, LocalDate startDate, LocalDate endDate, int limit) {
        String jpql = """
            SELECT sp.userId, u.name, COUNT(sp.id) as cnt
            FROM ScheduleParticipant sp
            JOIN Schedule s ON sp.scheduleId = s.id
            JOIN User u ON sp.userId = u.id
            WHERE s.clubId = :clubId
              AND s.scheduledAt >= :startDateTime
              AND s.scheduledAt < :endDateTime
              AND sp.status = 'CONFIRMED'
              AND sp.asGuest = false
            GROUP BY sp.userId, u.name
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
     * 다승점(POINTS) 랭킹 조회 - 경기 승점 합계
     */
    private List<AwardRankingEntry> getPointsRanking(Long clubId, LocalDate startDate, LocalDate endDate, int limit) {
        // 기간 내 완료된 경기 조회
        String jpql = """
            SELECT m FROM Match m
            WHERE m.clubId = :clubId
              AND m.playedAt >= :startDateTime
              AND m.playedAt < :endDateTime
              AND m.result IS NOT NULL
            """;

        List<Match> matches = em.createQuery(jpql, Match.class)
                .setParameter("clubId", clubId)
                .setParameter("startDateTime", startDate.atStartOfDay())
                .setParameter("endDateTime", endDate.plusDays(1).atStartOfDay())
                .getResultList();

        // 선수별 승점 계산
        Map<Long, Long> pointsByUser = new HashMap<>();
        for (Match match : matches) {
            calculateMatchPoints(match, pointsByUser);
        }

        // 상위 limit명 추출
        List<Map.Entry<Long, Long>> topEntries = pointsByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .toList();

        // 사용자 이름 조회
        List<Long> userIds = topEntries.stream().map(Map.Entry::getKey).toList();
        Map<Long, String> userNames = getUserNames(userIds);

        // 랭킹 엔트리 생성
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
     * 정산 주기에 따른 기간 계산
     */
    private LocalDate[] calculatePeriodDates(AwardPeriod period, LocalDate startDate, LocalDate endDate) {
        // 명시적으로 기간이 지정된 경우
        if (startDate != null && endDate != null) {
            return new LocalDate[]{startDate, endDate};
        }

        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        return switch (period) {
            case HALF_YEAR -> {
                if (month <= 6) {
                    // 상반기: 1월 1일 ~ 6월 30일
                    yield new LocalDate[]{
                            LocalDate.of(year, 1, 1),
                            LocalDate.of(year, 6, 30)
                    };
                } else {
                    // 하반기: 7월 1일 ~ 12월 31일
                    yield new LocalDate[]{
                            LocalDate.of(year, 7, 1),
                            LocalDate.of(year, 12, 31)
                    };
                }
            }
            case YEARLY -> new LocalDate[]{
                    LocalDate.of(year, 1, 1),
                    LocalDate.of(year, 12, 31)
            };
        };
    }

    /**
     * 직전 완료 기간 계산 (수상자 뱃지 표시용)
     * - 현재 상반기 → 전년도 하반기
     * - 현재 하반기 → 올해 상반기
     */
    private LocalDate[] calculatePreviousPeriodDates(AwardPeriod period) {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        return switch (period) {
            case HALF_YEAR -> {
                if (month <= 6) {
                    // 현재 상반기 → 직전 기간은 전년도 하반기
                    yield new LocalDate[]{
                            LocalDate.of(year - 1, 7, 1),
                            LocalDate.of(year - 1, 12, 31)
                    };
                } else {
                    // 현재 하반기 → 직전 기간은 올해 상반기
                    yield new LocalDate[]{
                            LocalDate.of(year, 1, 1),
                            LocalDate.of(year, 6, 30)
                    };
                }
            }
            case YEARLY -> new LocalDate[]{
                    LocalDate.of(year - 1, 1, 1),
                    LocalDate.of(year - 1, 12, 31)
            };
        };
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
        LocalDate[] periodDates = calculatePreviousPeriodDates(policy.getAwardPeriod());
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
                .period(policy.getAwardPeriod())
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
            return;
        }

        // 2. 저장된 수상자가 없으면 실시간 집계
        List<AwardRankingEntry> rankings = switch (type) {
            case ATTENDANCE -> getAttendanceRanking(clubId, startDate, endDate, 1);
            case POINTS -> getPointsRanking(clubId, startDate, endDate, 1);
            case BOOKING -> getBookingRanking(clubId, startDate, endDate, 1);
        };

        if (!rankings.isEmpty()) {
            AwardRankingEntry winner = rankings.get(0);
            winnerUserIds.add(winner.getUserId());
            winners.add(AwardWinnersResponse.WinnerDetail.builder()
                    .type(type)
                    .userId(winner.getUserId())
                    .userName(winner.getUserName())
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

    /**
     * 기간 옵션 생성 (Admin용)
     * 현재 진행 중인 시즌은 제외하고 직전 완료 시즌부터 N개 반환
     */
    public List<Map<String, Object>> generatePeriodOptions(AwardPeriod period, int count) {
        List<Map<String, Object>> options = new ArrayList<>();
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        if (period == AwardPeriod.HALF_YEAR) {
            // 현재 시즌 건너뛰고 직전 완료 시즌부터 시작
            int startYear;
            boolean startFirstHalf;

            if (month <= 6) {
                // 현재 상반기 → 직전 완료는 전년 하반기
                startYear = year - 1;
                startFirstHalf = false;
            } else {
                // 현재 하반기 → 직전 완료는 올해 상반기
                startYear = year;
                startFirstHalf = true;
            }

            for (int i = 0; i < count; i++) {
                LocalDate periodStart, periodEnd;
                String label;

                if (startFirstHalf) {
                    // 상반기
                    periodStart = LocalDate.of(startYear, 1, 1);
                    periodEnd = LocalDate.of(startYear, 6, 30);
                    label = startYear + "년 상반기";
                } else {
                    // 하반기
                    periodStart = LocalDate.of(startYear, 7, 1);
                    periodEnd = LocalDate.of(startYear, 12, 31);
                    label = startYear + "년 하반기";
                }

                Map<String, Object> option = new HashMap<>();
                option.put("label", label);
                option.put("periodStart", periodStart.toString());
                option.put("periodEnd", periodEnd.toString());
                options.add(option);

                // 다음 반기로
                if (startFirstHalf) {
                    startYear--;
                    startFirstHalf = false;
                } else {
                    startFirstHalf = true;
                }
            }
        } else {
            // YEARLY: 현재 연도 제외, 전년부터 시작
            for (int i = 0; i < count; i++) {
                int targetYear = year - 1 - i;
                LocalDate periodStart = LocalDate.of(targetYear, 1, 1);
                LocalDate periodEnd = LocalDate.of(targetYear, 12, 31);

                Map<String, Object> option = new HashMap<>();
                option.put("label", targetYear + "년");
                option.put("periodStart", periodStart.toString());
                option.put("periodEnd", periodEnd.toString());
                options.add(option);
            }
        }

        return options;
    }
}
