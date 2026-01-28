package com.example.openrunapi.domain.audit.service;

import com.example.openrunapi.domain.audit.repository.AuditLogRepository;
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

    private final AuditLogRepository auditLogRepository;

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
        log.info("=== Audit Log TTL 정리 시작 ===");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
        log.info("삭제 기준 날짜: {} ({}일 이전)", cutoffDate, RETENTION_DAYS);

        // 삭제 대상 건수 조회
        long countToDelete = auditLogRepository.countByCreatedAtBefore(cutoffDate);
        log.info("삭제 대상: {} 건", countToDelete);

        if (countToDelete > 0) {
            int deletedCount = auditLogRepository.deleteByCreatedAtBefore(cutoffDate);
            log.info("삭제 완료: {} 건", deletedCount);
        } else {
            log.info("삭제할 데이터 없음");
        }

        log.info("=== Audit Log TTL 정리 완료 ===");
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
