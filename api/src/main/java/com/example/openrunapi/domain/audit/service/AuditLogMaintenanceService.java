package com.example.openrunapi.domain.audit.service;

import com.example.openrunapi.domain.audit.repository.AuditLogRepository;
import com.example.openrunapi.domain.batch.model.BatchJobHistory;
import com.example.openrunapi.domain.batch.service.BatchJobHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Audit Log 유지보수 서비스
 * - 2년 이상 된 로그 자동 삭제 (TTL)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogMaintenanceService {

    public static final String JOB_NAME = "AUDIT_LOG_CLEANUP";

    private final AuditLogRepository auditLogRepository;
    private final BatchJobHistoryService batchJobHistoryService;

    /**
     * 2년 보관 기간 (일 수)
     */
    private static final int RETENTION_DAYS = 730; // 2년

    /**
     * 매일 KST 03:30에 실행
     * - 2년 이상 된 audit_log 레코드 삭제
     */
    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Seoul")
    @Transactional
    public void cleanupOldAuditLogs() {
        BatchJobHistory history = batchJobHistoryService.startJob(JOB_NAME);

        try {
            log.info("=== Audit Log TTL 정리 시작 ===");

            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
            log.info("삭제 기준 날짜: {} ({}일 이전)", cutoffDate, RETENTION_DAYS);

            // 삭제 대상 건수 조회
            long countToDelete = auditLogRepository.countByCreatedAtBefore(cutoffDate);
            log.info("삭제 대상: {} 건", countToDelete);

            int deletedCount = 0;
            if (countToDelete > 0) {
                deletedCount = auditLogRepository.deleteByCreatedAtBefore(cutoffDate);
                log.info("삭제 완료: {} 건", deletedCount);
            } else {
                log.info("삭제할 데이터 없음");
            }

            log.info("=== Audit Log TTL 정리 완료 ===");

            // 성공 기록
            String summary = String.format("{\"targetCount\":%d,\"deletedCount\":%d}", countToDelete, deletedCount);
            batchJobHistoryService.markSuccess(history.getId(), summary);

        } catch (Exception e) {
            log.error("Audit Log 정리 실패", e);
            batchJobHistoryService.markFailed(history.getId(), e.getMessage());
            throw e;
        }
    }

    /**
     * 수동 실행 메서드 (관리자 호출용) - 이력 기록 포함
     */
    @Transactional
    public String executeNow() {
        log.info("[수동 실행] Audit Log 정리 작업 수동 실행");
        cleanupOldAuditLogs();
        return "Audit Log 정리 작업이 실행되었습니다.";
    }

    /**
     * 수동 정리 메서드 (관리자 호출용)
     *
     * @return 삭제된 레코드 수
     */
    @Transactional
    public int manualCleanup() {
        log.info("=== Audit Log 수동 정리 시작 ===");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deletedCount = auditLogRepository.deleteByCreatedAtBefore(cutoffDate);

        log.info("수동 정리 완료: {} 건 삭제", deletedCount);
        return deletedCount;
    }

    /**
     * 삭제 대상 건수 조회 (미리보기용)
     *
     * @return 삭제 대상 건수
     */
    public long getCleanupTargetCount() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
        return auditLogRepository.countByCreatedAtBefore(cutoffDate);
    }
}
