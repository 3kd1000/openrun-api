package com.example.openrunapi.domain.ball.model.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 공용구 보유자 지정/해제 요청
 */
public record UpdateBallKeeperRequest(
        @NotNull(message = "보유자 여부를 지정해주세요")
        Boolean isBallKeeper
) {}
