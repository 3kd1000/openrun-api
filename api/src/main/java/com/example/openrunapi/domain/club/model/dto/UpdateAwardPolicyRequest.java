package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.AwardPeriod;
import lombok.Getter;

@Getter
public class UpdateAwardPolicyRequest {
    private AwardPeriod awardPeriod;
    private Boolean awardAttendanceEnabled;
    private Boolean awardPointsEnabled;
    private Boolean awardBookingEnabled;
}
