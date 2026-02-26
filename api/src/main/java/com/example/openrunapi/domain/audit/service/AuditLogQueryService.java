package com.example.openrunapi.domain.audit.service;

import com.example.openrunapi.domain.audit.model.AuditActionType;
import com.example.openrunapi.domain.audit.model.AuditEntityType;
import com.example.openrunapi.domain.audit.model.AuditLog;
import com.example.openrunapi.domain.audit.model.dto.AuditLogResponse;
import com.example.openrunapi.domain.audit.repository.AuditLogRepository;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Audit Log 조회 서비스
 * Controller에서 분리된 조회 전용 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogQueryService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ScheduleRepository scheduleRepository;
    private final ObjectMapper objectMapper;

    /**
     * Audit 로그 목록 조회 (페이징 + 필터링)
     */
    public Page<AuditLogResponse> getAuditLogs(Long clubId, AuditEntityType entityType,
                                                AuditActionType actionType, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<AuditLog> auditLogs = findAuditLogs(clubId, entityType, actionType, pageable);

        // User, Club 이름을 한 번에 조회 (N+1 방지)
        Map<Long, String> userNameMap = getUserNameMap(auditLogs.getContent());
        Map<Long, String> clubNameMap = getClubNameMap(auditLogs.getContent());

        // SCHEDULE, SCHEDULE_PARTICIPANT 타입의 Schedule 정보 조회
        Map<Long, Schedule> scheduleMap = getScheduleMap(auditLogs.getContent());

        return auditLogs.map(auditLog -> buildResponse(auditLog, userNameMap, clubNameMap, scheduleMap));
    }

    /**
     * Audit 로그 단건 조회
     */
    public AuditLogResponse getAuditLogById(Long id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 Audit 로그를 찾을 수 없습니다: " + id));

        String userName = userRepository.findById(auditLog.getUserId())
                .map(User::getName)
                .orElse("Unknown");
        String clubName = auditLog.getClubId() == null
                ? "공개일정"
                : clubRepository.findById(auditLog.getClubId())
                        .map(Club::getName)
                        .orElse("Unknown");

        // Schedule 정보 조회
        LocalDateTime scheduledAt = null;
        String courtName = null;
        Integer durationMinutes = null;

        if (auditLog.getEntityType() == AuditEntityType.SCHEDULE) {
            Schedule schedule = scheduleRepository.findById(auditLog.getEntityId()).orElse(null);
            if (schedule != null) {
                scheduledAt = schedule.getScheduledAt();
                courtName = schedule.getCourtName();
                durationMinutes = schedule.getDurationMinutes();
            }
        } else if (auditLog.getEntityType() == AuditEntityType.SCHEDULE_PARTICIPANT) {
            Long scheduleId = extractScheduleIdFromChanges(auditLog.getChanges());
            if (scheduleId != null) {
                Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
                if (schedule != null) {
                    scheduledAt = schedule.getScheduledAt();
                    courtName = schedule.getCourtName();
                    durationMinutes = schedule.getDurationMinutes();
                }
            }
        }

        return AuditLogResponse.from(auditLog, userName, clubName, scheduledAt, courtName, durationMinutes);
    }

    // === Private Helper Methods ===

    private Page<AuditLog> findAuditLogs(Long clubId, AuditEntityType entityType,
                                          AuditActionType actionType, Pageable pageable) {
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

    private Map<Long, String> getUserNameMap(List<AuditLog> logs) {
        Set<Long> userIds = logs.stream()
                .map(AuditLog::getUserId)
                .collect(Collectors.toSet());

        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
    }

    private Map<Long, String> getClubNameMap(List<AuditLog> logs) {
        Set<Long> clubIds = logs.stream()
                .map(AuditLog::getClubId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        return clubRepository.findAllById(clubIds).stream()
                .collect(Collectors.toMap(Club::getId, Club::getName));
    }

    /**
     * SCHEDULE, SCHEDULE_PARTICIPANT 타입의 로그에서 Schedule 정보를 일괄 조회
     */
    private Map<Long, Schedule> getScheduleMap(List<AuditLog> logs) {
        Set<Long> scheduleIds = new HashSet<>();

        for (AuditLog log : logs) {
            if (log.getEntityType() == AuditEntityType.SCHEDULE) {
                scheduleIds.add(log.getEntityId());
            } else if (log.getEntityType() == AuditEntityType.SCHEDULE_PARTICIPANT) {
                Long scheduleId = extractScheduleIdFromChanges(log.getChanges());
                if (scheduleId != null) {
                    scheduleIds.add(scheduleId);
                }
            }
        }

        if (scheduleIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return scheduleRepository.findAllById(scheduleIds).stream()
                .collect(Collectors.toMap(Schedule::getId, s -> s));
    }

    /**
     * changes JSON에서 scheduleId 추출
     */
    private Long extractScheduleIdFromChanges(String changes) {
        if (changes == null || changes.isEmpty()) {
            return null;
        }
        try {
            Map<String, Object> changesMap = objectMapper.readValue(changes,
                    new TypeReference<Map<String, Object>>() {});

            // after에서 먼저 시도, 없으면 before에서 시도
            Long scheduleId = extractScheduleIdFromSection(changesMap.get("after"));
            if (scheduleId != null) {
                return scheduleId;
            }
            return extractScheduleIdFromSection(changesMap.get("before"));
        } catch (Exception e) {
            log.warn("Failed to parse changes JSON for scheduleId: {}", e.getMessage());
        }
        return null;
    }

    private Long extractScheduleIdFromSection(Object section) {
        if (section instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> sectionMap = (Map<String, Object>) section;
            Object scheduleId = sectionMap.get("scheduleId");
            if (scheduleId instanceof Number) {
                return ((Number) scheduleId).longValue();
            }
        }
        return null;
    }

    /**
     * AuditLog를 AuditLogResponse로 변환
     */
    private AuditLogResponse buildResponse(AuditLog log,
                                            Map<Long, String> userNameMap,
                                            Map<Long, String> clubNameMap,
                                            Map<Long, Schedule> scheduleMap) {
        LocalDateTime scheduledAt = null;
        String courtName = null;
        Integer durationMinutes = null;

        if (log.getEntityType() == AuditEntityType.SCHEDULE) {
            Schedule schedule = scheduleMap.get(log.getEntityId());
            if (schedule != null) {
                scheduledAt = schedule.getScheduledAt();
                courtName = schedule.getCourtName();
                durationMinutes = schedule.getDurationMinutes();
            }
        } else if (log.getEntityType() == AuditEntityType.SCHEDULE_PARTICIPANT) {
            Long scheduleId = extractScheduleIdFromChanges(log.getChanges());
            if (scheduleId != null) {
                Schedule schedule = scheduleMap.get(scheduleId);
                if (schedule != null) {
                    scheduledAt = schedule.getScheduledAt();
                    courtName = schedule.getCourtName();
                    durationMinutes = schedule.getDurationMinutes();
                }
            }
        }

        String clubName = log.getClubId() == null
                ? "공개일정"
                : clubNameMap.getOrDefault(log.getClubId(), "Unknown");

        return AuditLogResponse.from(log,
                userNameMap.getOrDefault(log.getUserId(), "Unknown"),
                clubName,
                scheduledAt,
                courtName,
                durationMinutes);
    }
}
