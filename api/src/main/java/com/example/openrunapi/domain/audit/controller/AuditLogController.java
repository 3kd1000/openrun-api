package com.example.openrunapi.domain.audit.controller;

import com.example.openrunapi.domain.audit.model.AuditActionType;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import com.example.openrunapi.domain.audit.model.dto.AuditLogResponse;
import com.example.openrunapi.domain.audit.service.AuditLogQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Audit Log 조회 API (백오피스용)
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogQueryService auditLogQueryService;

    /**
     * Audit 로그 목록 조회 (페이징 + 필터링)
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long clubId,
            @RequestParam(required = false) AuditEntityType entityType,
            @RequestParam(required = false) AuditActionType actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLogResponse> response = auditLogQueryService.getAuditLogs(
                clubId, entityType, actionType, page, size);

        return ResponseEntity.ok(response);
    }

    /**
     * Audit 로그 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLog(@PathVariable Long id) {
        AuditLogResponse response = auditLogQueryService.getAuditLogById(id);
        return ResponseEntity.ok(response);
    }
}
