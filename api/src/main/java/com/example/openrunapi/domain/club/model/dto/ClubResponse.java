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
    private final String regionDepth1;
    private final String regionDepth2;
    private final Long ownerUserId;
    private final String joinPolicy;
    private final String interclubRecruitmentStatus;
    private final String memberRecruitmentStatus;
    private final String memberRecruitmentNote;
    private final String activitySummary;
    private final Integer memberCount;
    private final LocalDateTime createdAt;

    public ClubResponse(Club club) {
        this.id = club.getId();
        this.name = club.getName();
        this.description = club.getDescription();
        this.region = club.getRegionDisplay();  // 화면 표시용 (depth1 + depth2 조합)
        this.regionDepth1 = club.getRegionDepth1();
        this.regionDepth2 = club.getRegionDepth2();
        this.ownerUserId = club.getOwnerUserId();
        this.joinPolicy = club.getJoinPolicy() != null ? club.getJoinPolicy().name() : null;
        this.interclubRecruitmentStatus = club.getInterclubRecruitmentStatus() != null ? club.getInterclubRecruitmentStatus().name() : null;
        this.memberRecruitmentStatus = club.getMemberRecruitmentStatus() != null ? club.getMemberRecruitmentStatus().name() : null;
        this.memberRecruitmentNote = club.getMemberRecruitmentNote();
        this.activitySummary = club.getActivitySummary();
        this.memberCount = club.getMemberCount();
        this.createdAt = club.getCreatedAt();
    }
}
