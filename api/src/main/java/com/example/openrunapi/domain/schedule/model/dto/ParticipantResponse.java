package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ParticipantResponse {
    private final Long id;
    private final Long scheduleId;
    private final Long userId;
    private final String userName;
    private final String guestName;
    private final boolean isRegistered;
    private final String status;
    private final Integer position;
    private final LocalDateTime joinedAt;
    private final boolean asGuest;
    private final List<String> awardTypes;  // 수상 타입 목록 (ATTENDANCE, POINTS, BOOKING)

    // JPQL용 생성자 (awardTypes 없이, guestName 포함)
    public ParticipantResponse(Long id, Long scheduleId, Long userId, String userName, String guestName, String status, Integer position, LocalDateTime joinedAt, boolean asGuest) {
        this.id = id;
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.userName = userName;
        this.guestName = guestName;
        this.isRegistered = (userId != null);
        this.status = status;
        this.position = position;
        this.joinedAt = joinedAt;
        this.asGuest = asGuest;
        this.awardTypes = List.of();
    }

    // Entity 변환 생성자
    public ParticipantResponse(ScheduleParticipant participant, String userName) {
        this.id = participant.getId();
        this.scheduleId = participant.getScheduleId();
        this.userId = participant.getUserId();
        this.userName = userName;
        this.guestName = participant.getGuestName();
        this.isRegistered = (participant.getUserId() != null);
        this.status = participant.getStatus().name();
        this.position = participant.getPosition();
        this.joinedAt = participant.getJoinedAt();
        this.asGuest = participant.isAsGuest();
        this.awardTypes = List.of();
    }

    // 수상 타입을 설정한 새 객체 반환
    public ParticipantResponse withAwardTypes(List<String> types) {
        return ParticipantResponse.builder()
                .id(this.id)
                .scheduleId(this.scheduleId)
                .userId(this.userId)
                .userName(this.userName)
                .guestName(this.guestName)
                .isRegistered(this.isRegistered)
                .status(this.status)
                .position(this.position)
                .joinedAt(this.joinedAt)
                .asGuest(this.asGuest)
                .awardTypes(types)
                .build();
    }
}
