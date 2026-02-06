package com.example.openrunapi.domain.admin.service;

import com.example.openrunapi.domain.admin.model.DailyStats;
import com.example.openrunapi.domain.admin.model.dto.DailyStatsHistoryResponse;
import com.example.openrunapi.domain.admin.repository.DailyStatsRepository;
import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.service.BatchJobHistoryService;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 일별 통계 수집 및 조회 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyStatsService {

    private static final String JOB_NAME = "DAILY_STATS_COLLECT";

    private final DailyStatsRepository dailyStatsRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final BatchJobHistoryService batchJobHistoryService;

    /**
     * 일별 통계 수집 배치 실행
     * - 전날(어제) 기준 통계 수집
     * - 이미 수집된 날짜는 스킵
     *
     * @return 실행 결과 메시지
     */
    @Transactional
    public String collectDailyStats() {
        BatchJobHistory history = batchJobHistoryService.startJob(JOB_NAME);

        try {
            // 전날 날짜 기준으로 수집 (자정에 실행되므로 전날 데이터 수집)
            LocalDate targetDate = LocalDate.now().minusDays(1);

            // 이미 수집된 날짜인지 확인
            if (dailyStatsRepository.existsByRecordDate(targetDate)) {
                String message = String.format("이미 수집된 날짜입니다: %s", targetDate);
                log.info("[DailyStats] {}", message);
                batchJobHistoryService.markSuccess(history.getId(), message);
                return message;
            }

            // 통계 계산
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();
            LocalDateTime startOfWeek = targetDate.minusDays(6).atStartOfDay(); // 7일간
            LocalDateTime startOfMonth = targetDate.minusDays(29).atStartOfDay(); // 30일간

            // 누적 지표 (해당일 기준)
            long totalUsers = userRepository.countNonGuestUsers();
            long totalClubs = clubRepository.count();

            // 활성 사용자 지표
            long dau = userRepository.countActiveUsersBetween(startOfDay, endOfDay);
            long wau = userRepository.countActiveUsersSince(startOfWeek);
            long mau = userRepository.countActiveUsersSince(startOfMonth);

            // 신규 지표
            long newUsers = userRepository.countNewUsersBetween(startOfDay, endOfDay);
            long newClubs = clubRepository.countNewClubsSince(startOfDay);

            // 저장
            DailyStats stats = DailyStats.builder()
                    .recordDate(targetDate)
                    .totalUsers(totalUsers)
                    .totalClubs(totalClubs)
                    .dau(dau)
                    .wau(wau)
                    .mau(mau)
                    .newUsers(newUsers)
                    .newClubs(newClubs)
                    .build();

            dailyStatsRepository.save(stats);

            String message = String.format(
                    "통계 수집 완료 [%s] - 총사용자: %d, 총클럽: %d, DAU: %d, WAU: %d, MAU: %d, 신규가입: %d, 신규클럽: %d",
                    targetDate, totalUsers, totalClubs, dau, wau, mau, newUsers, newClubs
            );
            log.info("[DailyStats] {}", message);
            batchJobHistoryService.markSuccess(history.getId(), message);

            return message;

        } catch (Exception e) {
            log.error("[DailyStats] 통계 수집 실패", e);
            batchJobHistoryService.markFailed(history.getId(), e.getMessage());
            throw e;
        }
    }

    /**
     * 특정 기간의 통계 히스토리 조회
     *
     * @param period 조회 기간 (1M, 3M, 6M, 1Y)
     * @return 통계 히스토리 응답
     */
    @Transactional(readOnly = true)
    public DailyStatsHistoryResponse getStatsHistory(String period) {
        LocalDate startDate = calculateStartDate(period);
        List<DailyStats> statsList = dailyStatsRepository.findByRecordDateAfterOrderByRecordDateAsc(startDate);

        return DailyStatsHistoryResponse.from(statsList, period);
    }

    /**
     * 가장 최근 통계 조회
     */
    @Transactional(readOnly = true)
    public DailyStats getLatestStats() {
        return dailyStatsRepository.findTopByOrderByRecordDateDesc().orElse(null);
    }

    private LocalDate calculateStartDate(String period) {
        LocalDate now = LocalDate.now();
        return switch (period.toUpperCase()) {
            case "1M" -> now.minusMonths(1);
            case "3M" -> now.minusMonths(3);
            case "6M" -> now.minusMonths(6);
            case "1Y" -> now.minusYears(1);
            default -> now.minusMonths(1); // 기본값 1개월
        };
    }
}
