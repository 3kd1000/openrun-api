package com.example.openrunapi.domain.ball.model.dto;

import java.util.List;

/**
 * 공용구 현황 응답
 */
public record BallSummaryResponse(
        int totalQuantity,
        int ballKeeperCount,
        int monthlyUsed,
        int monthlyAdded,
        List<BallKeeperResponse> keepers
) {
    public static BallSummaryResponse of(
            int totalQuantity,
            int ballKeeperCount,
            int monthlyUsed,
            int monthlyAdded,
            List<BallKeeperResponse> keepers
    ) {
        return new BallSummaryResponse(
                totalQuantity,
                ballKeeperCount,
                monthlyUsed,
                monthlyAdded,
                keepers
        );
    }
}
