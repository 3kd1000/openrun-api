package com.example.openrunapi.domain.ball.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 공용구 수량 조정 요청 (단일)
 * quantity는 차이값 (양수: 증가, 음수: 감소)
 */
public record AdjustBallRequest(
        @NotNull(message = "멤버를 선택해주세요")
        Long memberId,

        @NotNull(message = "수량을 입력해주세요")
        Integer quantity,

        @Size(max = 500, message = "설명은 500자 이하로 입력해주세요")
        String description
) {}
