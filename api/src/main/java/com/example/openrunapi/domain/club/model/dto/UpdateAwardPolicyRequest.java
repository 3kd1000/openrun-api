package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.RankingPeriod;
import lombok.Getter;

@Getter
public class UpdateAwardPolicyRequest {
    private Boolean awardEnabled;
    private Boolean awardAttendanceEnabled;
    private Boolean awardPointsEnabled;
    private Boolean awardBookingEnabled;
    private RankingPeriod rankingPeriod;
    private String rankingCustomSeasons;
}
