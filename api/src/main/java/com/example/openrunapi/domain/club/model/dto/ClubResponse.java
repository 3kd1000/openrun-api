package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.Club;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ClubResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final String region;
    private final Long ownerUserId;
    private final String joinPolicy;
    private final String interclubRecruitmentStatus;
    private final String memberRecruitmentStatus;
    private final LocalDateTime createdAt;

    public ClubResponse(Club club) {
        this.id = club.getId();
        this.name = club.getName();
        this.description = club.getDescription();
        this.region = club.getRegion();
        this.ownerUserId = club.getOwnerUserId();
        this.joinPolicy = club.getJoinPolicy() != null ? club.getJoinPolicy().name() : null;
        this.interclubRecruitmentStatus = club.getInterclubRecruitmentStatus() != null ? club.getInterclubRecruitmentStatus().name() : null;
        this.memberRecruitmentStatus = club.getMemberRecruitmentStatus() != null ? club.getMemberRecruitmentStatus().name() : null;
        this.createdAt = club.getCreatedAt();
    }
}
