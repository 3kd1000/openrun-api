package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * ScheduleParticipant 엔티티의 Audit용 스냅샷 DTO
 */
@Getter
@Builder
public class ScheduleParticipantAuditSnapshot {
    private Long id;
    private Long scheduleId;
    private Long userId;
    private boolean asGuest;
    private String status;
    private Integer position;
    private LocalDateTime joinedAt;

    public static ScheduleParticipantAuditSnapshot from(ScheduleParticipant participant) {
        if (participant == null) {
            return null;
        }
        return ScheduleParticipantAuditSnapshot.builder()
                .id(participant.getId())
                .scheduleId(participant.getScheduleId())
                .userId(participant.getUserId())
                .asGuest(participant.isAsGuest())
                .status(participant.getStatus() != null ? participant.getStatus().name() : null)
                .position(participant.getPosition())
                .joinedAt(participant.getJoinedAt())
                .build();
    }
}
