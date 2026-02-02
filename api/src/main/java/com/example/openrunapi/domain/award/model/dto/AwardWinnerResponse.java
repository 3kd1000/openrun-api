package com.example.openrunapi.domain.award.model.dto;

import com.example.openrunapi.domain.award.model.AwardWinner;
import com.example.openrunapi.domain.club.model.AwardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 어워드 수상자 응답 DTO
 */
@Getter
@Builder
@AllArgsConstructor
public class AwardWinnerResponse {
    private Long id;
    private Long clubId;
    private Long userId;
    private String userName;  // 조인해서 가져옴
    private AwardType awardType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long value;
    private Boolean isManual;
    private LocalDateTime createdAt;

    public static AwardWinnerResponse from(AwardWinner winner, String userName) {
        return AwardWinnerResponse.builder()
                .id(winner.getId())
                .clubId(winner.getClubId())
                .userId(winner.getUserId())
                .userName(userName)
                .awardType(winner.getAwardType())
                .periodStart(winner.getPeriodStart())
                .periodEnd(winner.getPeriodEnd())
                .value(winner.getValue())
                .isManual(winner.getIsManual())
                .createdAt(winner.getCreatedAt())
                .build();
    }
}
