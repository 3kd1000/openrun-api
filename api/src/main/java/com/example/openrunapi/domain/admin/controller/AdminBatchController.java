package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.model.dto.BatchHistoryResponse;
import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.admin.service.DailyStatsService;
import com.example.openrunapi.domain.audit.service.AuditLogMaintenanceService;
import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.service.BatchJobHistoryService;
import com.example.openrunapi.domain.schedule.service.ScheduleMaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin 배치 작업 이력 조회 및 수동 실행 API
 * - 배치 작업 실행 결과 모니터링
 * - 배치 작업 수동 실행
 * - System Admin 권한 필요
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/batch")
@RequiredArgsConstructor
public class AdminBatchController {

    private final BatchJobHistoryService batchJobHistoryService;
    private final AdminUserService adminUserService;
    private final ScheduleMaintenanceService scheduleMaintenanceService;
    private final AuditLogMaintenanceService auditLogMaintenanceService;
    private final DailyStatsService dailyStatsService;

    /**
     * 전체 배치 이력 조회 (페이징)
     */
    @GetMapping("/history")
    public ResponseEntity<Page<BatchHistoryResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        Page<BatchJobHistory> historyPage = batchJobHistoryService.getHistory(PageRequest.of(page, size));
        Page<BatchHistoryResponse> responsePage = historyPage.map(BatchHistoryResponse::from);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * 특정 작업의 배치 이력 조회 (페이징)
     */
    @GetMapping("/history/{jobName}")
    public ResponseEntity<Page<BatchHistoryResponse>> getHistoryByJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        Page<BatchJobHistory> historyPage = batchJobHistoryService.getHistoryByJobName(
                jobName, PageRequest.of(page, size));
        Page<BatchHistoryResponse> responsePage = historyPage.map(BatchHistoryResponse::from);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * 각 작업별 최근 실행 결과 조회 (대시보드용)
     */
    @GetMapping("/latest")
    public ResponseEntity<List<BatchHistoryResponse>> getLatestByEachJob(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<BatchJobHistory> latestJobs = batchJobHistoryService.getLatestByEachJob();
        List<BatchHistoryResponse> response = latestJobs.stream()
                .map(BatchHistoryResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 작업의 최근 10개 이력 조회
     */
    @GetMapping("/recent/{jobName}")
    public ResponseEntity<List<BatchHistoryResponse>> getRecentHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobName) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<BatchJobHistory> recentJobs = batchJobHistoryService.getRecentHistory(jobName);
        List<BatchHistoryResponse> response = recentJobs.stream()
                .map(BatchHistoryResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 일정 유지보수 배치 수동 실행
     */
    @PostMapping("/execute/SCHEDULE_MAINTENANCE")
    public ResponseEntity<Map<String, String>> executeScheduleMaintenance(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());
        log.info("[Admin] 일정 유지보수 배치 수동 실행 요청 by {}", userDetails.getUsername());

        try {
            String result = scheduleMaintenanceService.executeNow();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", result
            ));
        } catch (Exception e) {
            log.error("[Admin] 일정 유지보수 배치 실행 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "배치 작업 실행 중 오류: " + e.getMessage()
            ));
        }
    }

    /**
     * 감사 로그 정리 배치 수동 실행
     */
    @PostMapping("/execute/AUDIT_LOG_CLEANUP")
    public ResponseEntity<Map<String, String>> executeAuditLogCleanup(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());
        log.info("[Admin] 감사 로그 정리 배치 수동 실행 요청 by {}", userDetails.getUsername());

        try {
            String result = auditLogMaintenanceService.executeNow();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", result
            ));
        } catch (Exception e) {
            log.error("[Admin] 감사 로그 정리 배치 실행 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "배치 작업 실행 중 오류: " + e.getMessage()
            ));
        }
    }

    /**
     * 일별 통계 수집 배치 수동 실행
     */
    @PostMapping("/execute/DAILY_STATS_COLLECT")
    public ResponseEntity<Map<String, String>> executeDailyStatsCollect(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());
        log.info("[Admin] 일별 통계 수집 배치 수동 실행 요청 by {}", userDetails.getUsername());

        try {
            String result = dailyStatsService.collectDailyStats();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", result
            ));
        } catch (Exception e) {
            log.error("[Admin] 일별 통계 수집 배치 실행 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "배치 작업 실행 중 오류: " + e.getMessage()
            ));
        }
    }
}
