package com.example.openrunapi.domain.schedule.model.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 참가자 일괄 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
public class BulkUpdateParticipantsRequest {
    private List<Long> userIds;
}
