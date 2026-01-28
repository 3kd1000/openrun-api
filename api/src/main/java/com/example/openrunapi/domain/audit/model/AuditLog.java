package com.example.openrunapi.domain.audit.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Audit Log 엔티티
 * Schedule, ScheduleParticipant, Match 변경 이력 추적
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_audit_log_club_created", columnList = "club_id, created_at DESC"),
    @Index(name = "idx_audit_log_entity", columnList = "entity_type, entity_id, created_at DESC"),
    @Index(name = "idx_audit_log_created_at", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private AuditEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private AuditActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "changes", columnDefinition = "jsonb")
    private String changes;

    @Column(name = "club_id", nullable = false)
    private Long clubId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @Builder
    public AuditLog(Long userId, AuditEntityType entityType, Long entityId,
                    AuditActionType actionType, String changes, Long clubId) {
        this.userId = userId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.actionType = actionType;
        this.changes = changes;
        this.clubId = clubId;
    }
}
