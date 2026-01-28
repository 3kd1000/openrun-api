package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.draw.model.DrawType;
import com.example.openrunapi.domain.schedule.model.MatchType;
import com.example.openrunapi.domain.schedule.model.Schedule;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Schedule 엔티티의 Audit용 스냅샷 DTO
 */
@Getter
@Builder
public class ScheduleAuditSnapshot {
    private Long id;
    private Long clubId;
    private String courtName;
    private LocalDateTime scheduledAt;
    private Integer maxCapacity;
    private Integer currentParticipants;
    private BigDecimal cost;
    private String description;
    private Long reservedByUserId;
    private LocalDateTime participationStartAt;
    private DrawType drawType;
    private MatchType matchType;
    private Boolean isDrawValid;
    private Boolean pinned;
    private Boolean guestRecruitOpen;
    private String guestRecruitNote;
    private Boolean interclubRecruitOpen;
    private String interclubRecruitNote;
    private Integer durationMinutes;

    public static ScheduleAuditSnapshot from(Schedule schedule) {
        if (schedule == null) {
            return null;
        }
        return ScheduleAuditSnapshot.builder()
                .id(schedule.getId())
                .clubId(schedule.getClubId())
                .courtName(schedule.getCourtName())
                .scheduledAt(schedule.getScheduledAt())
                .maxCapacity(schedule.getMaxCapacity())
                .currentParticipants(schedule.getCurrentParticipants())
                .cost(schedule.getCost())
                .description(schedule.getDescription())
                .reservedByUserId(schedule.getReservedByUserId())
                .participationStartAt(schedule.getParticipationStartAt())
                .drawType(schedule.getDrawType())
                .matchType(schedule.getMatchType())
                .isDrawValid(schedule.getIsDrawValid())
                .pinned(schedule.getPinned())
                .guestRecruitOpen(schedule.getGuestRecruitOpen())
                .guestRecruitNote(schedule.getGuestRecruitNote())
                .interclubRecruitOpen(schedule.getInterclubRecruitOpen())
                .interclubRecruitNote(schedule.getInterclubRecruitNote())
                .durationMinutes(schedule.getDurationMinutes())
                .build();
    }
}
