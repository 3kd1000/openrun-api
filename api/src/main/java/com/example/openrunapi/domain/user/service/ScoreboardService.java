package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.match.model.Match;
import com.example.openrunapi.domain.match.repository.MatchRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.model.dto.ScoreboardResponse;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreboardService {

    private final UserStatisticsRepository userStatisticsRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final ClubMemberRepository clubMemberRepository;

    /**
     * 클럽 스코어보드 조회
     * - 승점 내림차순 → 득실차 내림차순 정렬
     * - 사용자 이름 포함
     * - 게스트 사용자 제외
     * 
     * @param clubId 클럽 ID
     * @param startDate 시작일 (optional, null이면 전체 기간)
     * @param endDate 종료일 (optional, null이면 전체 기간)
     * @param sortBy 정렬 기준 (points, totalMatches, winRate)
     * @return 랭킹 리스트
     */
    @Transactional(readOnly = true)
    public ScoreboardResponse getClubScoreboard(Long clubId, LocalDateTime startDate, LocalDateTime endDate, String sortBy) {
        log.info("=== 스코어보드 조회 ===");
        log.info("clubId: {}, startDate: {}, endDate: {}, sortBy: {}", clubId, startDate, endDate, sortBy);

        // 기간 필터가 있으면 Match 테이블에서 직접 집계, 없으면 UserStatistics 사용
        if (startDate != null || endDate != null) {
            return getClubScoreboardByDateRange(clubId, startDate, endDate, sortBy);
        } else {
            return getClubScoreboardAllTime(clubId, sortBy);
        }
    }

    /**
     * 전체 기간 스코어보드 조회 (기존 로직)
     */
    private ScoreboardResponse getClubScoreboardAllTime(Long clubId, String sortBy) {
        // 1. 통계 조회 (승점 순 정렬, 게스트 제외)
        List<UserStatistics> statistics = userStatisticsRepository
                .findByClubIdExcludingGuestsOrderByPointsDescGoalDifferenceDesc(clubId);

        if (statistics.isEmpty()) {
            return ScoreboardResponse.builder()
                    .rankings(List.of())
                    .build();
        }

        // 2. 사용자 ID 목록 추출
        List<Long> userIds = statistics.stream()
                .map(UserStatistics::getUserId)
                .collect(Collectors.toList());

        // 3. 사용자 정보 일괄 조회
        List<User> users = userRepository.findAllById(userIds);
        Map<Long, String> userNameMap = users.stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        // 3-1. 클럽 ACTIVE 멤버만 랭킹에 포함 (외부 승인 게스트/비멤버 제외)
        List<Long> activeMemberIds = clubMemberRepository.findActiveMemberUserIdsInClub(clubId, userIds);
        Set<Long> activeMemberIdSet = new HashSet<>(activeMemberIds);

        // 4. 랭킹 엔트리 생성 및 정렬
        List<ScoreboardResponse.RankingEntry> rankings = statistics.stream()
                .map(stats -> {
                    String userName = userNameMap.getOrDefault(stats.getUserId(), "알 수 없음");

                    return ScoreboardResponse.RankingEntry.builder()
                            .rank(0) // 정렬 후 순위 부여
                            .userId(stats.getUserId())
                            .userName(userName)
                            .totalMatches(stats.getTotalMatches())
                            .points(stats.getPoints())
                            .winRate(stats.getWinRate())
                            .wins(stats.getWins())
                            .draws(stats.getDraws())
                            .losses(stats.getLosses())
                            .build();
                })
                .filter(entry -> activeMemberIdSet.contains(entry.getUserId()))
                .sorted((a, b) -> compareRankings(a, b, sortBy))
                .collect(Collectors.toList());

        // 5. 순위 부여
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }

        return ScoreboardResponse.builder()
                .rankings(rankings)
                .build();
    }

    /**
     * 기간별 스코어보드 조회 (Match 테이블에서 직접 집계)
     */
    private ScoreboardResponse getClubScoreboardByDateRange(Long clubId, LocalDateTime startDate, LocalDateTime endDate, String sortBy) {
        // 1. 기간 내 완료된 경기만 조회
        List<Match> matches = matchRepository.findAll((root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            predicates.add(criteriaBuilder.equal(root.get("clubId"), clubId));
            predicates.add(criteriaBuilder.isNotNull(root.get("result")));
            predicates.add(criteriaBuilder.isNotNull(root.get("teamAScore")));
            predicates.add(criteriaBuilder.isNotNull(root.get("teamBScore")));
            
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("playedAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("playedAt"), endDate));
            }
            
            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

        // 2. 선수별 통계 집계
        Map<Long, PlayerStats> statsMap = new HashMap<>();
        
        for (Match match : matches) {
            // Team A 선수들
            processPlayerStats(statsMap, match, match.getTeamAPlayer1Id(), true);
            if (match.getTeamAPlayer2Id() != null) {
                processPlayerStats(statsMap, match, match.getTeamAPlayer2Id(), true);
            }
            
            // Team B 선수들
            processPlayerStats(statsMap, match, match.getTeamBPlayer1Id(), false);
            if (match.getTeamBPlayer2Id() != null) {
                processPlayerStats(statsMap, match, match.getTeamBPlayer2Id(), false);
            }
        }

        // 3. 게스트 사용자 제외
        List<Long> playerIds = new ArrayList<>(statsMap.keySet());
        List<User> users = userRepository.findAllById(playerIds);
        Map<Long, String> userNameMap = users.stream()
                .filter(user -> !user.isGuest())
                .collect(Collectors.toMap(User::getId, User::getName));

        // 3-1. 클럽 ACTIVE 멤버만 포함 (외부 승인 게스트/비멤버 제외)
        List<Long> activeMemberIds = clubMemberRepository.findActiveMemberUserIdsInClub(clubId, new ArrayList<>(userNameMap.keySet()));
        Set<Long> activeMemberIdSet = new HashSet<>(activeMemberIds);

        // 4. 통계를 랭킹 엔트리로 변환 및 정렬
        List<ScoreboardResponse.RankingEntry> rankings = statsMap.entrySet().stream()
                .filter(entry -> userNameMap.containsKey(entry.getKey())) // 게스트 제외
                .filter(entry -> activeMemberIdSet.contains(entry.getKey())) // 비멤버 제외
                .map(entry -> {
                    Long userId = entry.getKey();
                    PlayerStats stats = entry.getValue();
                    String userName = userNameMap.get(userId);

                    return ScoreboardResponse.RankingEntry.builder()
                            .rank(0) // 나중에 정렬 후 순위 부여
                            .userId(userId)
                            .userName(userName)
                            .totalMatches(stats.totalMatches)
                            .points(stats.points)
                            .winRate(stats.winRate)
                            .wins(stats.wins)
                            .draws(stats.draws)
                            .losses(stats.losses)
                            .build();
                })
                .sorted((a, b) -> compareRankings(a, b, sortBy))
                .collect(Collectors.toList());

        // 5. 순위 부여
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }

        return ScoreboardResponse.builder()
                .rankings(rankings)
                .build();
    }

    /**
     * 선수 통계 처리 (내부 클래스)
     */
    private static class PlayerStats {
        int totalMatches = 0;
        int wins = 0;
        int draws = 0;
        int losses = 0;
        int points = 0;
        BigDecimal winRate = BigDecimal.ZERO;
    }

    /**
     * 개별 선수 통계 업데이트
     */
    private void processPlayerStats(Map<Long, PlayerStats> statsMap, Match match, Long playerId, boolean isTeamA) {
        if (playerId == null) return;

        PlayerStats stats = statsMap.computeIfAbsent(playerId, k -> new PlayerStats());
        stats.totalMatches++;

        boolean isWin = (isTeamA && match.getResult() == Match.MatchResult.TEAM_A_WIN) ||
                        (!isTeamA && match.getResult() == Match.MatchResult.TEAM_B_WIN);
        boolean isDraw = match.getResult() == Match.MatchResult.DRAW;

        if (isWin) {
            stats.wins++;
            stats.points += 3;
        } else if (isDraw) {
            stats.draws++;
            stats.points += 1;
        } else {
            stats.losses++;
        }

        // 승률 계산
        if (stats.totalMatches > 0) {
            BigDecimal winCount = BigDecimal.valueOf(stats.wins);
            BigDecimal drawCount = BigDecimal.valueOf(stats.draws).multiply(BigDecimal.valueOf(0.5));
            BigDecimal totalCount = BigDecimal.valueOf(stats.totalMatches);

            stats.winRate = winCount.add(drawCount)
                    .divide(totalCount, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
    }

    /**
     * 랭킹 비교 (정렬용)
     * @param a 첫 번째 랭킹 엔트리
     * @param b 두 번째 랭킹 엔트리
     * @param sortBy 정렬 기준 (points, totalMatches, winRate)
     * @return 비교 결과 (내림차순)
     */
    private int compareRankings(ScoreboardResponse.RankingEntry a, ScoreboardResponse.RankingEntry b, String sortBy) {
        if (sortBy == null || sortBy.isEmpty() || "points".equals(sortBy)) {
            // 기본: 승점 내림차순 → 경기수 내림차순 → 승수 내림차순 → 이름 가나다순
            int pointsCompare = Integer.compare(b.getPoints(), a.getPoints());
            if (pointsCompare != 0) return pointsCompare;

            int matchesCompare = Integer.compare(b.getTotalMatches(), a.getTotalMatches());
            if (matchesCompare != 0) return matchesCompare;

            int winsCompare = Integer.compare(b.getWins(), a.getWins());
            if (winsCompare != 0) return winsCompare;

            return a.getUserName().compareTo(b.getUserName());
        } else if ("totalMatches".equals(sortBy)) {
            // 경기수 내림차순 → 승점 내림차순 → 승수 내림차순 → 이름 가나다순
            int matchesCompare = Integer.compare(b.getTotalMatches(), a.getTotalMatches());
            if (matchesCompare != 0) return matchesCompare;

            int pointsCompare = Integer.compare(b.getPoints(), a.getPoints());
            if (pointsCompare != 0) return pointsCompare;

            int winsCompare = Integer.compare(b.getWins(), a.getWins());
            if (winsCompare != 0) return winsCompare;

            return a.getUserName().compareTo(b.getUserName());
        } else if ("winRate".equals(sortBy)) {
            // 승률 내림차순 → 경기수 내림차순 → 승수 내림차순 → 이름 가나다순
            int winRateCompare = b.getWinRate().compareTo(a.getWinRate());
            if (winRateCompare != 0) return winRateCompare;

            int matchesCompare = Integer.compare(b.getTotalMatches(), a.getTotalMatches());
            if (matchesCompare != 0) return matchesCompare;

            int winsCompare = Integer.compare(b.getWins(), a.getWins());
            if (winsCompare != 0) return winsCompare;

            return a.getUserName().compareTo(b.getUserName());
        } else {
            // 기본값: 승점
            int pointsCompare = Integer.compare(b.getPoints(), a.getPoints());
            if (pointsCompare != 0) return pointsCompare;

            int matchesCompare = Integer.compare(b.getTotalMatches(), a.getTotalMatches());
            if (matchesCompare != 0) return matchesCompare;

            int winsCompare = Integer.compare(b.getWins(), a.getWins());
            if (winsCompare != 0) return winsCompare;

            return a.getUserName().compareTo(b.getUserName());
        }
    }
}
