package com.example.openrunapi.domain.schedule.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 일정 참가신청/취소 배치 처리 응답
 */
@Getter
@Builder
@AllArgsConstructor
public class BatchParticipationResponse {
    /**
     * 성공적으로 참가신청한 일정 ID 목록
     */
    private final List<Long> joinedScheduleIds;

    /**
     * 성공적으로 취소한 일정 ID 목록
     */
    private final List<Long> canceledScheduleIds;

    /**
     * 실패한 작업 목록
     */
    private final List<FailedOperation> failedOperations;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class FailedOperation {
        private final Long scheduleId;
        private final String operation; // "JOIN" 또는 "CANCEL"
        private final String errorMessage;
    }
}
