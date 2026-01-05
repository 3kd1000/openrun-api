package com.example.openrunapi.domain.schedule.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 일정 참가신청/취소 배치 처리 요청
 * - 최종적으로 참가하고 싶은 일정 ID 목록만 전송
 * - 백엔드에서 현재 참가 상태와 비교하여 추가/삭제 계산
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BatchParticipationRequest {
    /**
     * 최종적으로 참가하고 싶은 일정 ID 목록
     */
    private List<Long> selectedScheduleIds;
}
