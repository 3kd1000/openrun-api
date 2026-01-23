package com.example.openrunapi.domain.ball.model.dto;

import com.example.openrunapi.domain.ball.model.BallTransactionType;
import com.example.openrunapi.domain.ball.model.ClubBallTransaction;

import java.time.LocalDateTime;

/**
 * 공용구 거래 내역 응답
 */
public record BallTransactionResponse(
        Long id,
        BallTransactionType type,
        int quantity,
        Long fromMemberId,
        String fromMemberName,
        Long toMemberId,
        String toMemberName,
        Long scheduleId,
        LocalDateTime scheduleAt,
        String scheduleCourt,
        Integer scheduleParticipants,
        Integer scheduleMaxCapacity,
        String description,
        Long createdById,
        String createdByName,
        LocalDateTime createdAt
) {
    public static BallTransactionResponse from(ClubBallTransaction transaction) {
        return new BallTransactionResponse(
                transaction.getId(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getFromMember() != null ? transaction.getFromMember().getId() : null,
                transaction.getFromMember() != null ? transaction.getFromMember().getUser().getName() : null,
                transaction.getToMember() != null ? transaction.getToMember().getId() : null,
                transaction.getToMember() != null ? transaction.getToMember().getUser().getName() : null,
                transaction.getSchedule() != null ? transaction.getSchedule().getId() : null,
                transaction.getSchedule() != null ? transaction.getSchedule().getScheduledAt() : null,
                transaction.getSchedule() != null ? transaction.getSchedule().getCourtName() : null,
                transaction.getSchedule() != null ? transaction.getSchedule().getCurrentParticipants() : null,
                transaction.getSchedule() != null ? transaction.getSchedule().getMaxCapacity() : null,
                transaction.getDescription(),
                transaction.getCreatedBy().getId(),
                transaction.getCreatedBy().getName(),
                transaction.getCreatedAt()
        );
    }
}
