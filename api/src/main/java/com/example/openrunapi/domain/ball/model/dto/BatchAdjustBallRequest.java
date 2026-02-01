package com.example.openrunapi.domain.ball.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 공용구 수량 일괄 조정 요청
 */
public record BatchAdjustBallRequest(
        @NotEmpty(message = "조정할 항목이 없습니다")
        @Valid
        List<AdjustBallRequest> adjustments
) {}
