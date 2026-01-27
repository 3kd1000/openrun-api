package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.common.service.PermissionService;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
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
    private final String clubName;
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
    private final String matchType;
    private final Boolean isDrawValid;
    private final LocalDateTime drawCreatedAt;
    private final Boolean pinned;
    private final Boolean guestRecruitOpen;
    private final String guestRecruitNote;
    private final Boolean interclubRecruitOpen;
    private final String interclubRecruitNote;
    private final Integer durationMinutes;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final Boolean canManageSchedule; // 권한 정보 (nullable, 요청 userId가 없으면 null)

    public ScheduleResponse(Schedule schedule, ClubRepository clubRepository, UserRepository userRepository) {
        this(schedule, clubRepository, userRepository, null, null);
    }

    public ScheduleResponse(Schedule schedule, ClubRepository clubRepository, UserRepository userRepository, PermissionService permissionService, Long requestUserId) {
        this.id = schedule.getId();
        this.clubId = schedule.getClubId();

        // 클럽명 조회 (항상 수행)
        this.clubName = clubRepository.findById(schedule.getClubId())
                .map(Club::getName)
                .orElse(null);

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
        this.matchType = schedule.getMatchType() != null ? schedule.getMatchType().name() : null;
        this.isDrawValid = schedule.getIsDrawValid();
        this.drawCreatedAt = schedule.getDrawCreatedAt();
        this.pinned = Boolean.TRUE.equals(schedule.getPinned());
        this.guestRecruitOpen = Boolean.TRUE.equals(schedule.getGuestRecruitOpen());
        this.guestRecruitNote = schedule.getGuestRecruitNote();
        this.interclubRecruitOpen = Boolean.TRUE.equals(schedule.getInterclubRecruitOpen());
        this.interclubRecruitNote = schedule.getInterclubRecruitNote();
        this.durationMinutes = schedule.getDurationMinutes() != null ? schedule.getDurationMinutes() : 120;
        this.createdAt = schedule.getCreatedAt();
        this.updatedAt = schedule.getUpdatedAt();

        // 권한 체크 (permissionService와 requestUserId가 제공된 경우에만)
        if (permissionService != null && requestUserId != null) {
            this.canManageSchedule = permissionService.canManageSchedule(requestUserId, schedule.getClubId());
        } else {
            this.canManageSchedule = null;
        }
    }
}
