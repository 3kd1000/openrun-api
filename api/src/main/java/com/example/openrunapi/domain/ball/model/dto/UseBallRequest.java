package com.example.openrunapi.domain.ball.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 공용구 사용 기록 요청
 */
public record UseBallRequest(
        @NotNull(message = "보유자를 선택해주세요")
        Long fromMemberId,

        @NotNull(message = "일정을 선택해주세요")
        Long scheduleId,

        @NotNull(message = "수량을 입력해주세요")
        @Min(value = 1, message = "수량은 1 이상이어야 합니다")
        Integer quantity,

        @Size(max = 500, message = "설명은 500자 이하로 입력해주세요")
        String description
) {}
