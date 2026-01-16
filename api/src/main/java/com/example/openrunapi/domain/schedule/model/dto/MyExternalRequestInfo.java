package com.example.openrunapi.domain.schedule.model.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 내 외부 신청 정보 (ExternalRequest 기반)
 */
@Getter
@Builder
public class MyExternalRequestInfo {
    private final Long requestId;
    private final String status;    // PENDING, APPROVED, REJECTED, CANCELLED, null
    private final String type;      // GUEST, INTERCLUB
    private final LocalDateTime createdAt;
}
