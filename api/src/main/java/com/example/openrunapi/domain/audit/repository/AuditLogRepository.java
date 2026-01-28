package com.example.openrunapi.domain.audit.repository;

import com.example.openrunapi.domain.audit.model.AuditLog;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * 클럽별 Audit 로그 조회 (최신순)
     */
    List<AuditLog> findByClubIdOrderByCreatedAtDesc(Long clubId);

    /**
     * 전체 Audit 로그 조회 (페이징, 최신순)
     */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 클럽별 Audit 로그 조회 (페이징, 최신순)
     */
    Page<AuditLog> findByClubIdOrderByCreatedAtDesc(Long clubId, Pageable pageable);

    /**
     * Entity Type으로 필터링 (페이징)
     */
    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(AuditEntityType entityType, Pageable pageable);

    /**
     * Action Type으로 필터링 (페이징)
     */
    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(
            com.example.openrunapi.domain.audit.model.AuditActionType actionType, Pageable pageable);

    /**
     * Entity Type + Action Type 필터링 (페이징)
     */
    Page<AuditLog> findByEntityTypeAndActionTypeOrderByCreatedAtDesc(
            AuditEntityType entityType,
            com.example.openrunapi.domain.audit.model.AuditActionType actionType,
            Pageable pageable);

    /**
     * 클럽 + Entity Type 필터링 (페이징)
     */
    Page<AuditLog> findByClubIdAndEntityTypeOrderByCreatedAtDesc(
            Long clubId, AuditEntityType entityType, Pageable pageable);

    /**
     * 클럽 + Action Type 필터링 (페이징)
     */
    Page<AuditLog> findByClubIdAndActionTypeOrderByCreatedAtDesc(
            Long clubId, com.example.openrunapi.domain.audit.model.AuditActionType actionType, Pageable pageable);

    /**
     * 클럽 + Entity Type + Action Type 필터링 (페이징)
     */
    Page<AuditLog> findByClubIdAndEntityTypeAndActionTypeOrderByCreatedAtDesc(
            Long clubId, AuditEntityType entityType,
            com.example.openrunapi.domain.audit.model.AuditActionType actionType, Pageable pageable);

    /**
     * 특정 엔티티의 변경 이력 조회
     */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            AuditEntityType entityType, Long entityId);

    /**
     * TTL 배치: 특정 날짜 이전의 로그 삭제
     */
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.createdAt < :cutoffDate")
    int deleteByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * TTL 배치: 삭제 대상 건수 조회
     */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt < :cutoffDate")
    long countByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);
}
