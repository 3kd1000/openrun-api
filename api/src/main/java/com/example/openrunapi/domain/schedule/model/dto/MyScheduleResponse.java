package com.example.openrunapi.domain.schedule.model.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 내 일정 응답 (개인일정 조회용)
 * - 일정 기본 정보 + 내 참가 정보 + 내 외부 신청 정보
 */
@Getter
@Builder
public class MyScheduleResponse {
    private final ScheduleResponse schedule;
    private final MyParticipationInfo myParticipation;      // ScheduleParticipant 정보
    private final MyExternalRequestInfo myExternalRequest;  // ExternalRequest 정보
}
