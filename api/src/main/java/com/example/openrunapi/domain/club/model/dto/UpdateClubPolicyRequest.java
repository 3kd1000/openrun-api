package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubJoinPolicy;
import com.example.openrunapi.domain.club.model.InterclubRecruitmentStatus;
import com.example.openrunapi.domain.club.model.MemberRecruitmentStatus;
import lombok.Getter;

@Getter
public class UpdateClubPolicyRequest {
    private ClubJoinPolicy joinPolicy;
    private InterclubRecruitmentStatus interclubRecruitmentStatus;
    private MemberRecruitmentStatus memberRecruitmentStatus;
    private String memberRecruitmentNote;
}

