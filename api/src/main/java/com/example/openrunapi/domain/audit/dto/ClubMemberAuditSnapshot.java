package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.ClubRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * ClubMember 엔티티의 Audit용 스냅샷 DTO
 */
@Getter
@Builder
public class ClubMemberAuditSnapshot {
    private Long id;
    private Long clubId;
    private Long userId;
    private String userName;  // 추적 용이성을 위해 이름도 저장
    private ClubMemberStatus status;
    private ClubRole role;
    private LocalDateTime joinedAt;

    public static ClubMemberAuditSnapshot from(ClubMember member) {
        if (member == null) {
            return null;
        }
        return ClubMemberAuditSnapshot.builder()
                .id(member.getId())
                .clubId(member.getClub().getId())
                .userId(member.getUser().getId())
                .userName(member.getUser().getName())
                .status(member.getStatus())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
