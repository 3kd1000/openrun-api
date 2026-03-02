package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubMember;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 내가 가입한 클럽 응답 (role 포함)
 */
@Getter
public class MyClubResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final String region;
    private final String regionDepth1;
    private final String regionDepth2;
    private final String role;  // 해당 클럽에서 나의 역할 (OWNER, ADMIN, REGULAR)
    private final String logoUrl;
    private final Integer memberCount;
    private final LocalDateTime createdAt;

    public MyClubResponse(ClubMember clubMember) {
        this.id = clubMember.getClub().getId();
        this.name = clubMember.getClub().getName();
        this.description = clubMember.getClub().getDescription();
        this.region = clubMember.getClub().getRegionDisplay();
        this.regionDepth1 = clubMember.getClub().getRegionDepth1();
        this.regionDepth2 = clubMember.getClub().getRegionDepth2();
        this.role = clubMember.getRole().name();
        this.logoUrl = clubMember.getClub().getLogoUrl();
        this.memberCount = clubMember.getClub().getMemberCount();
        this.createdAt = clubMember.getClub().getCreatedAt();
    }
}
