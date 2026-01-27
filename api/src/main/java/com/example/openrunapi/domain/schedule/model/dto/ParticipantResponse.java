package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ParticipantResponse {
    private final Long id;
    private final Long scheduleId;
    private final Long userId;
    private final String userName; // 추가
    private final String status;
    private final Integer position;
    private final LocalDateTime joinedAt;
    private final boolean asGuest;

    public ParticipantResponse(Long id, Long scheduleId, Long userId, String userName, String status, Integer position, LocalDateTime joinedAt, boolean asGuest) {
        this.id = id;
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.userName = userName;
        this.status = status;
        this.position = position;
        this.joinedAt = joinedAt;
        this.asGuest = asGuest;
    }

    public ParticipantResponse(ScheduleParticipant participant, String userName) {
        this.id = participant.getId();
        this.scheduleId = participant.getScheduleId();
        this.userId = participant.getUserId();
        this.userName = userName;
        this.status = participant.getStatus().name();
        this.position = participant.getPosition();
        this.joinedAt = participant.getJoinedAt();
        this.asGuest = participant.isAsGuest();
    }
}
