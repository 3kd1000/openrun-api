package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.ClubRole;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 클럽원 상세 정보 응답 DTO
 * - ClubMember 정보 + User 연락처 정보를 함께 포함
 */
@Getter
public class ClubMembershipResponse {

    // ClubMember 정보
    private final Long memberId;
    private final ClubRole role;
    private final ClubMemberStatus status;
    private final LocalDateTime joinedAt;

    // User 정보
    private final Long userId;
    private final String name;
    private final String email;
    private final String imageUrl;

    public ClubMembershipResponse(ClubMember clubMember) {
        this.memberId = clubMember.getId();
        this.role = clubMember.getRole();
        this.status = clubMember.getStatus();
        this.joinedAt = clubMember.getJoinedAt();

        this.userId = clubMember.getUser().getId();
        this.name = clubMember.getUser().getName();
        this.email = clubMember.getUser().getEmail();
        this.imageUrl = clubMember.getUser().getImageUrl();
    }
}
