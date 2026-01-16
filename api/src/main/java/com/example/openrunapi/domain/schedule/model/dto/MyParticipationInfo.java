package com.example.openrunapi.domain.schedule.model.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 내 참가 정보 (ScheduleParticipant 기반)
 */
@Getter
@Builder
public class MyParticipationInfo {
    private final String status;          // CONFIRMED, WAITING, null
    private final Integer waitingNumber;  // WAITING일 때 대기 순번
    private final Boolean asGuest;        // 게스트 여부
}
