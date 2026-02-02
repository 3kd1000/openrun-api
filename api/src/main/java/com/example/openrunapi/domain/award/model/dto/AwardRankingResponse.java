package com.example.openrunapi.domain.award.model.dto;

import com.example.openrunapi.domain.club.model.AwardPeriod;
import com.example.openrunapi.domain.club.model.AwardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AwardRankingResponse {
    private final AwardType type;
    private final AwardPeriod period;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final List<AwardRankingEntry> rankings;
}
