package com.example.openrunapi.domain.batch.controller;

import com.example.openrunapi.domain.audit.service.AuditLogMaintenanceService;
import com.example.openrunapi.domain.schedule.service.ScheduleMaintenanceService;
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

    private boolean validateInternalKey(String internalKey) {
        if (batchKey == null || batchKey.isBlank()) {
            log.warn("[Internal Batch] INTERNAL_BATCH_KEY 환경변수가 설정되지 않음");
            return false;
        }
        return batchKey.equals(internalKey);
    }
}
