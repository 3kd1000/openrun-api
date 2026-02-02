package com.example.openrunapi.domain.club.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE club SET deleted = true WHERE id = ?") // Soft delete 처리
@SQLRestriction("deleted = false") // 항상 deleted = false 인 데이터만 조회
@Table(name = "club")
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    private String region;

    @Column(name = "region_depth1", length = 20)
    private String regionDepth1;  // 시/도

    @Column(name = "region_depth2", length = 20)
    private String regionDepth2;  // 시/군/구

    @Column(nullable = false)
    private Long ownerUserId;

    // 정책 필드는 ClubPolicy 테이블로 분리됨 (V62 마이그레이션)

    @Column(name = "activity_summary", length = 200)
    private String activitySummary;

    @Column(name = "member_count")
    private Integer memberCount = 0;

    private boolean deleted = false;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Club(String name, String description, String region, Long ownerUserId) {
        this.name = name;
        this.description = description;
        this.region = region;
        this.ownerUserId = ownerUserId;
    }

    public void update(String name, String description, String region) {
        this.name = name;
        this.description = description;
        this.region = region;
    }

    public void updateRegion(String regionDepth1, String regionDepth2) {
        this.regionDepth1 = regionDepth1;
        this.regionDepth2 = regionDepth2;
        // region 필드도 함께 업데이트 (하위 호환성)
        if (regionDepth1 != null && !regionDepth1.isEmpty()) {
            this.region = regionDepth2 != null && !regionDepth2.isEmpty()
                    ? regionDepth1 + " " + regionDepth2
                    : regionDepth1;
        }
    }

    /**
     * 화면 표시용 지역 문자열 반환
     * regionDepth1/2가 있으면 조합, 없으면 기존 region 반환
     */
    public String getRegionDisplay() {
        if (regionDepth1 != null && !regionDepth1.isEmpty()) {
            if (regionDepth2 != null && !regionDepth2.isEmpty()) {
                return regionDepth1 + " " + regionDepth2;
            }
            return regionDepth1;
        }
        return region;
    }

    // updatePolicies()는 ClubPolicy로 이관됨

    public void changeOwner(Long newOwnerUserId) {
        this.ownerUserId = newOwnerUserId;
    }

    public void updateActivitySummary(String activitySummary) {
        this.activitySummary = activitySummary;
    }

    public void updateMemberCount(Integer memberCount) {
        this.memberCount = memberCount != null ? memberCount : 0;
    }
}
