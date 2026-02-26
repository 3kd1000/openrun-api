package com.example.openrunapi.domain.batch.controller;

import com.example.openrunapi.domain.admin.service.DailyStatsService;
import com.example.openrunapi.domain.audit.service.AuditLogMaintenanceService;
import com.example.openrunapi.domain.batch.model.BatchJobStatus;
import com.example.openrunapi.domain.batch.service.BatchJobHistoryService;
import com.example.openrunapi.domain.schedule.service.ScheduleMaintenanceService;
import com.example.openrunapi.domain.schedule.service.ScheduleReminderService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 내부 배치 작업 실행 API
 * - K8s CronJob에서 호출
 * - X-Internal-Key 헤더로 인증
 */
@Slf4j
@RestController
@RequestMapping("/internal/batch")
@RequiredArgsConstructor
public class InternalBatchController {

    private final ScheduleMaintenanceService scheduleMaintenanceService;
    private final AuditLogMaintenanceService auditLogMaintenanceService;
    private final DailyStatsService dailyStatsService;
    private final ScheduleReminderService scheduleReminderService;
    private final BatchJobHistoryService batchJobHistoryService;
    private final ObjectMapper objectMapper;

    @Value("${openrun.internal.batch-key:}")
    private String batchKey;

    /**
     * 일정 유지보수 배치 실행
     * K8s CronJob: 매일 KST 03:00 (UTC 18:00)
     */
    @PostMapping("/execute/SCHEDULE_MAINTENANCE")
    public ResponseEntity<Map<String, String>> executeScheduleMaintenance(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {

        if (!validateInternalKey(internalKey)) {
            log.warn("[Internal Batch] 인증 실패 - SCHEDULE_MAINTENANCE");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        log.info("[Internal Batch] 일정 유지보수 배치 실행 시작");
        try {
            String result = scheduleMaintenanceService.executeBatch();
            return ResponseEntity.ok(Map.of("status", "success", "message", result));
        } catch (Exception e) {
            log.error("[Internal Batch] 일정 유지보수 배치 실행 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * 감사 로그 정리 배치 실행
     * K8s CronJob: 매일 KST 03:30 (UTC 18:30)
     */
    @PostMapping("/execute/AUDIT_LOG_CLEANUP")
    public ResponseEntity<Map<String, String>> executeAuditLogCleanup(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {

        if (!validateInternalKey(internalKey)) {
            log.warn("[Internal Batch] 인증 실패 - AUDIT_LOG_CLEANUP");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        log.info("[Internal Batch] 감사 로그 정리 배치 실행 시작");
        try {
            auditLogMaintenanceService.cleanupOldAuditLogs();
            return ResponseEntity.ok(Map.of("status", "success", "message", "Audit log cleanup completed"));
        } catch (Exception e) {
            log.error("[Internal Batch] 감사 로그 정리 배치 실행 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * 일별 통계 수집 배치 실행
     * K8s CronJob: 매일 KST 00:05 (UTC 15:05)
     */
    @PostMapping("/execute/DAILY_STATS_COLLECT")
    public ResponseEntity<Map<String, String>> executeDailyStatsCollect(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {

        if (!validateInternalKey(internalKey)) {
            log.warn("[Internal Batch] 인증 실패 - DAILY_STATS_COLLECT");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        log.info("[Internal Batch] 일별 통계 수집 배치 실행 시작");
        try {
            String result = dailyStatsService.collectDailyStats();
            return ResponseEntity.ok(Map.of("status", "success", "message", result));
        } catch (Exception e) {
            log.error("[Internal Batch] 일별 통계 수집 배치 실행 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * 일정 전날 리마인드 알림 발송
     * K8s CronJob: 매일 KST 09:00 (UTC 00:00)
     */
    @PostMapping("/execute/SCHEDULE_REMINDER")
    public ResponseEntity<Map<String, String>> executeScheduleReminder(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {

        if (!validateInternalKey(internalKey)) {
            log.warn("[Internal Batch] 인증 실패 - SCHEDULE_REMINDER");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        log.info("[Internal Batch] 일정 리마인드 배치 실행 시작");
        try {
            String result = scheduleReminderService.sendReminders();
            return ResponseEntity.ok(Map.of("status", "success", "message", result));
        } catch (Exception e) {
            log.error("[Internal Batch] 일정 리마인드 배치 실행 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * 이미지 정리 작업 결과 보고
     * K8s CronJob에서 이미지 정리 완료 후 호출
     *
     * @param request 보고 데이터
     *                - status: SUCCESS/FAILED
     *                - beforeCount: 정리 전 이미지 수
     *                - afterCount: 정리 후 이미지 수
     *                - deletedCount: 삭제된 이미지 수
     *                - durationMs: 작업 소요 시간 (ms)
     *                - errorMessage: 에러 메시지 (실패 시)
     */
    @PostMapping("/report/IMAGE_CLEANUP")
    public ResponseEntity<Map<String, String>> reportImageCleanup(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey,
            @RequestBody Map<String, Object> request) {

        if (!validateInternalKey(internalKey)) {
            log.warn("[Internal Batch] 인증 실패 - IMAGE_CLEANUP report");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "error", "message", "Unauthorized"));
        }

        log.info("[Internal Batch] 이미지 정리 결과 보고: {}", request);

        try {
            String statusStr = (String) request.getOrDefault("status", "SUCCESS");
            BatchJobStatus status = "FAILED".equalsIgnoreCase(statusStr)
                    ? BatchJobStatus.FAILED
                    : BatchJobStatus.SUCCESS;

            // 결과 요약 생성
            Map<String, Object> summary = Map.of(
                    "beforeCount", request.getOrDefault("beforeCount", 0),
                    "afterCount", request.getOrDefault("afterCount", 0),
                    "deletedCount", request.getOrDefault("deletedCount", 0)
            );
            String resultSummary = objectMapper.writeValueAsString(summary);

            String errorMessage = (String) request.get("errorMessage");
            Long durationMs = request.get("durationMs") != null
                    ? ((Number) request.get("durationMs")).longValue()
                    : null;

            batchJobHistoryService.reportExternalJob(
                    "IMAGE_CLEANUP",
                    status,
                    resultSummary,
                    errorMessage,
                    durationMs
            );

            return ResponseEntity.ok(Map.of("status", "success", "message", "Report received"));
        } catch (JsonProcessingException e) {
            log.error("[Internal Batch] 결과 직렬화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", "Failed to process result"));
        } catch (Exception e) {
            log.error("[Internal Batch] 이미지 정리 결과 보고 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private boolean validateInternalKey(String internalKey) {
        if (batchKey == null || batchKey.isBlank()) {
            log.warn("[Internal Batch] INTERNAL_BATCH_KEY 환경변수가 설정되지 않음");
            return false;
        }
        return batchKey.equals(internalKey);
    }
}
