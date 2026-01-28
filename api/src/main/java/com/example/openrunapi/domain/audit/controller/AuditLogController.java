package com.example.openrunapi.domain.audit.controller;

import com.example.openrunapi.domain.audit.model.AuditActionType;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import com.example.openrunapi.domain.audit.model.AuditLog;
import com.example.openrunapi.domain.audit.model.dto.AuditLogResponse;
import com.example.openrunapi.domain.audit.repository.AuditLogRepository;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Audit Log 조회 API (백오피스용)
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;

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

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<AuditLog> auditLogs = findAuditLogs(clubId, entityType, actionType, pageable);

        // User, Club 이름을 한 번에 조회 (N+1 방지)
        Set<Long> userIds = auditLogs.getContent().stream()
                .map(AuditLog::getUserId)
                .collect(Collectors.toSet());
        Set<Long> clubIds = auditLogs.getContent().stream()
                .map(AuditLog::getClubId)
                .collect(Collectors.toSet());

        Map<Long, String> userNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        Map<Long, String> clubNameMap = clubRepository.findAllById(clubIds).stream()
                .collect(Collectors.toMap(Club::getId, Club::getName));

        Page<AuditLogResponse> response = auditLogs.map(log ->
                AuditLogResponse.from(log,
                        userNameMap.getOrDefault(log.getUserId(), "Unknown"),
                        clubNameMap.getOrDefault(log.getClubId(), "Unknown")));

        return ResponseEntity.ok(response);
    }

    /**
     * Audit 로그 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLog(@PathVariable Long id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 Audit 로그를 찾을 수 없습니다: " + id));

        String userName = userRepository.findById(auditLog.getUserId())
                .map(User::getName)
                .orElse("Unknown");
        String clubName = clubRepository.findById(auditLog.getClubId())
                .map(Club::getName)
                .orElse("Unknown");

        return ResponseEntity.ok(AuditLogResponse.from(auditLog, userName, clubName));
    }

    private Page<AuditLog> findAuditLogs(Long clubId, AuditEntityType entityType,
                                          AuditActionType actionType, Pageable pageable) {
        // 모든 조합에 대한 쿼리 분기
        if (clubId != null && entityType != null && actionType != null) {
            return auditLogRepository.findByClubIdAndEntityTypeAndActionTypeOrderByCreatedAtDesc(
                    clubId, entityType, actionType, pageable);
        } else if (clubId != null && entityType != null) {
            return auditLogRepository.findByClubIdAndEntityTypeOrderByCreatedAtDesc(
                    clubId, entityType, pageable);
        } else if (clubId != null && actionType != null) {
            return auditLogRepository.findByClubIdAndActionTypeOrderByCreatedAtDesc(
                    clubId, actionType, pageable);
        } else if (entityType != null && actionType != null) {
            return auditLogRepository.findByEntityTypeAndActionTypeOrderByCreatedAtDesc(
                    entityType, actionType, pageable);
        } else if (clubId != null) {
            return auditLogRepository.findByClubIdOrderByCreatedAtDesc(clubId, pageable);
        } else if (entityType != null) {
            return auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
        } else if (actionType != null) {
            return auditLogRepository.findByActionTypeOrderByCreatedAtDesc(actionType, pageable);
        } else {
            return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
    }
}
