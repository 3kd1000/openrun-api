package com.example.openrunapi.domain.schedule.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 커서 기반 페이지네이션 응답 DTO
 * - 리스트뷰 Infinite Scroll 지원
 */
@Getter
@AllArgsConstructor
public class ScheduleCursorResponse {
    private List<ScheduleResponse> content;
    private boolean hasMore;
    private LocalDateTime nextCursor;  // 다음 조회 시 사용할 커서 (마지막 일정의 scheduledAt)
    private int size;
}
