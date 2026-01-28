package com.example.openrunapi.domain.audit.model.dto;

import com.example.openrunapi.domain.audit.model.AuditActionType;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import com.example.openrunapi.domain.audit.model.AuditLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Audit Log 응답 DTO
 */
@Getter
@Builder
public class AuditLogResponse {
    private Long id;
    private Long userId;
    private String userName;  // 조인해서 가져올 경우
    private AuditEntityType entityType;
    private Long entityId;
    private AuditActionType actionType;
    private String changes;  // JSON string
    private Long clubId;
    private String clubName;  // 조인해서 가져올 경우
    private LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .userId(auditLog.getUserId())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .actionType(auditLog.getActionType())
                .changes(auditLog.getChanges())
                .clubId(auditLog.getClubId())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }

    public static AuditLogResponse from(AuditLog auditLog, String userName, String clubName) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .userId(auditLog.getUserId())
                .userName(userName)
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .actionType(auditLog.getActionType())
                .changes(auditLog.getChanges())
                .clubId(auditLog.getClubId())
                .clubName(clubName)
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
