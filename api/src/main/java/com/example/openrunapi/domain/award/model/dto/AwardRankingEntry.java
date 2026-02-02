package com.example.openrunapi.domain.award.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AwardRankingEntry {
    private final Integer rank;
    private final Long userId;
    private final String userName;
    private final Long value;  // 참석 횟수, 승점, 예약 횟수 등
}
