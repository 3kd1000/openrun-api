package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class ScheduleResponse {

    private final Long id;
    private final Long clubId;
    private final String courtName;
    private final LocalDateTime scheduledAt;
    private final Integer maxCapacity;
    private final Integer currentParticipants;
    private final BigDecimal cost;
    private final String description;
    private final Long reservedByUserId;
    private final String reservedByUserName;
    private final LocalDateTime participationStartAt;
    private final String drawType;
    private final Boolean isDrawValid;
    private final LocalDateTime drawCreatedAt;
    private final Boolean pinned;
    private final Boolean guestRecruitOpen;
    private final String guestRecruitNote;
    private final Boolean interclubRecruitOpen;
    private final String interclubRecruitNote;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final Boolean canManageSchedule; // 권한 정보 (nullable, 요청 userId가 없으면 null)

    public ScheduleResponse(Schedule schedule) {
        this(schedule, null, null, null);
    }

    public ScheduleResponse(Schedule schedule, UserRepository userRepository) {
        this(schedule, userRepository, null, null);
    }

    public ScheduleResponse(Schedule schedule, UserRepository userRepository, PermissionService permissionService, Long requestUserId) {
        this.id = schedule.getId();
        this.clubId = schedule.getClubId();
        this.courtName = schedule.getCourtName();
        this.scheduledAt = schedule.getScheduledAt();
        this.maxCapacity = schedule.getMaxCapacity();
        this.currentParticipants = schedule.getCurrentParticipants();
        this.cost = schedule.getCost();
        this.description = schedule.getDescription();
        this.reservedByUserId = schedule.getReservedByUserId();

        // 예약자 이름 조회 (userRepository가 제공된 경우에만)
        if (schedule.getReservedByUserId() != null && userRepository != null) {
            this.reservedByUserName = userRepository.findById(schedule.getReservedByUserId())
                    .map(User::getName)
                    .orElse(null);
        } else {
            this.reservedByUserName = null;
        }

        this.participationStartAt = schedule.getParticipationStartAt();
        this.drawType = schedule.getDrawType() != null ? schedule.getDrawType().name() : null;
        this.isDrawValid = schedule.getIsDrawValid();
        this.drawCreatedAt = schedule.getDrawCreatedAt();
        this.pinned = Boolean.TRUE.equals(schedule.getPinned());
        this.guestRecruitOpen = Boolean.TRUE.equals(schedule.getGuestRecruitOpen());
        this.guestRecruitNote = schedule.getGuestRecruitNote();
        this.interclubRecruitOpen = Boolean.TRUE.equals(schedule.getInterclubRecruitOpen());
        this.interclubRecruitNote = schedule.getInterclubRecruitNote();
        this.createdAt = schedule.getCreatedAt();
        this.updatedAt = schedule.getUpdatedAt();

        // 권한 체크 (permissionService와 requestUserId가 제공된 경우에만)
        if (permissionService != null && requestUserId != null) {
            this.canManageSchedule = permissionService.canManageSchedule(requestUserId, schedule.getClubId());
            System.out.println("[DEBUG] ScheduleResponse - scheduleId: " + schedule.getId()
                + ", requestUserId: " + requestUserId
                + ", clubId: " + schedule.getClubId()
                + ", canManageSchedule: " + this.canManageSchedule);
        } else {
            this.canManageSchedule = null;
            System.out.println("[DEBUG] ScheduleResponse - scheduleId: " + schedule.getId()
                + ", permissionService: " + (permissionService != null ? "NOT NULL" : "NULL")
                + ", requestUserId: " + requestUserId
                + " -> canManageSchedule = NULL");
        }
    }
}
