package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.club.model.Club;
import lombok.Builder;
import lombok.Getter;

/**
 * Club 엔티티의 Audit용 스냅샷 DTO
 * 정책 필드는 ClubPolicy 테이블로 분리됨 (V62 마이그레이션)
 */
@Getter
@Builder
public class ClubAuditSnapshot {
    private Long id;
    private String name;
    private String description;
    private String region;
    private String regionDepth1;
    private String regionDepth2;
    private Long ownerUserId;
    private String activitySummary;
    private Integer memberCount;

    public static ClubAuditSnapshot from(Club club) {
        if (club == null) {
            return null;
        }
        return ClubAuditSnapshot.builder()
                .id(club.getId())
                .name(club.getName())
                .description(club.getDescription())
                .region(club.getRegion())
                .regionDepth1(club.getRegionDepth1())
                .regionDepth2(club.getRegionDepth2())
                .ownerUserId(club.getOwnerUserId())
                .activitySummary(club.getActivitySummary())
                .memberCount(club.getMemberCount())
                .build();
    }
}
