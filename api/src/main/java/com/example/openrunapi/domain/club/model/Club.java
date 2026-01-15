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

    @Column(nullable = false)
    private Long ownerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_policy", nullable = false, length = 20)
    private ClubJoinPolicy joinPolicy = ClubJoinPolicy.APPROVAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "interclub_recruitment_status", nullable = false, length = 20)
    private InterclubRecruitmentStatus interclubRecruitmentStatus = InterclubRecruitmentStatus.CLOSED;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_recruitment_status", nullable = false, length = 20)
    private MemberRecruitmentStatus memberRecruitmentStatus = MemberRecruitmentStatus.OPEN;

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

    public void updatePolicies(ClubJoinPolicy joinPolicy, InterclubRecruitmentStatus interclubRecruitmentStatus, MemberRecruitmentStatus memberRecruitmentStatus) {
        if (joinPolicy != null) {
            this.joinPolicy = joinPolicy;
        }
        if (interclubRecruitmentStatus != null) {
            this.interclubRecruitmentStatus = interclubRecruitmentStatus;
        }
        if (memberRecruitmentStatus != null) {
            this.memberRecruitmentStatus = memberRecruitmentStatus;
        }
    }

    public void changeOwner(Long newOwnerUserId) {
        this.ownerUserId = newOwnerUserId;
    }
}
