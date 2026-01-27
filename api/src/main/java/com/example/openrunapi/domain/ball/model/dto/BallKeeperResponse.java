package com.example.openrunapi.domain.ball.model.dto;

import com.example.openrunapi.domain.club.model.ClubMember;

/**
 * 공용구 보유자 정보
 */
public record BallKeeperResponse(
        Long memberId,
        Long userId,
        String userName,
        String imageUrl,
        int quantity
) {
    public static BallKeeperResponse from(ClubMember member) {
        return new BallKeeperResponse(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getName(),
                member.getUser().getImageUrl(),
                member.getBallQuantity()
        );
    }
}
