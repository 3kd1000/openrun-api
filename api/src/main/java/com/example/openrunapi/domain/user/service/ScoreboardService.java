package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.model.dto.ScoreboardResponse;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.user.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreboardService {

    private final UserStatisticsRepository userStatisticsRepository;
    private final UserRepository userRepository;

    /**
     * 클럽 스코어보드 조회
     * - 승점 내림차순 → 득실차 내림차순 정렬
     * - 사용자 이름 포함
     */
    @Transactional(readOnly = true)
    public ScoreboardResponse getClubScoreboard(Long clubId) {
        log.info("클럽 스코어보드 조회: club_id={}", clubId);

        // 1. 통계 조회 (승점 순 정렬)
        List<UserStatistics> statistics = userStatisticsRepository
                .findByClubIdOrderByPointsDescGoalDifferenceDesc(clubId);

        if (statistics.isEmpty()) {
            log.info("통계 데이터 없음: club_id={}", clubId);
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

        // 4. 랭킹 엔트리 생성
        List<ScoreboardResponse.RankingEntry> rankings = IntStream.range(0, statistics.size())
                .mapToObj(index -> {
                    UserStatistics stats = statistics.get(index);
                    String userName = userNameMap.getOrDefault(stats.getUserId(), "알 수 없음");

                    return ScoreboardResponse.RankingEntry.builder()
                            .rank(index + 1)
                            .userId(stats.getUserId())
                            .userName(userName)
                            .totalMatches(stats.getTotalMatches())
                            .points(stats.getPoints())
                            .winRate(stats.getWinRate())
                            .wins(stats.getWins())
                            .draws(stats.getDraws())
                            .losses(stats.getLosses())
                            .goalDifference(stats.getGoalDifference())
                            .totalPointsScored(stats.getTotalPointsScored())
                            .totalPointsConceded(stats.getTotalPointsConceded())
                            .build();
                })
                .collect(Collectors.toList());

        log.info("스코어보드 조회 완료: {} 명", rankings.size());

        return ScoreboardResponse.builder()
                .rankings(rankings)
                .build();
    }
}
