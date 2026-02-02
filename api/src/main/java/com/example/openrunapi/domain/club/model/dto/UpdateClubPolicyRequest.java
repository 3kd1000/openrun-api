package com.example.openrunapi.domain.club.model.dto;

import lombok.Getter;

@Getter
public class UpdateClubPolicyRequest {
    private Boolean autoJoinEnabled;
    private Boolean interclubRecruitmentOpen;
    private Boolean memberRecruitmentOpen;
    private String memberRecruitmentNote;
}
