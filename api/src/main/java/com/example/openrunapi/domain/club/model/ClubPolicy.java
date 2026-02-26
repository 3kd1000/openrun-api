package com.example.openrunapi.domain.club.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "club_policy")
public class ClubPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "club_id", nullable = false, unique = true)
    private Long clubId;

    // 기본 정책 필드들 (Boolean 통일)
    @Column(name = "auto_join_enabled", nullable = false)
    private Boolean autoJoinEnabled = false;  // 자동 가입 승인 (true = 자동, false = 승인필요)

    @Column(name = "interclub_recruitment_open", nullable = false)
    private Boolean interclubRecruitmentOpen = false;  // 교류전 모집 공개

    @Column(name = "member_recruitment_open", nullable = false)
    private Boolean memberRecruitmentOpen = true;  // 회원 모집 공개

    @Column(name = "member_recruitment_note", columnDefinition = "text")
    private String memberRecruitmentNote;

    // 어워드 정책 필드들
    @Column(name = "award_enabled", nullable = false)
    private Boolean awardEnabled = true;  // 어워드 기능 글로벌 ON/OFF

    @Enumerated(EnumType.STRING)
    @Column(name = "award_period", nullable = false, length = 20)
    private AwardPeriod awardPeriod = AwardPeriod.HALF_YEAR;

    @Column(name = "award_attendance_enabled", nullable = false)
    private Boolean awardAttendanceEnabled = true;

    @Column(name = "award_points_enabled", nullable = false)
    private Boolean awardPointsEnabled = true;

    @Column(name = "award_booking_enabled", nullable = false)
    private Boolean awardBookingEnabled = true;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public ClubPolicy(Long clubId) {
        this.clubId = clubId;
    }

    /**
     * 기본 정책 업데이트
     */
    public void updateGeneralPolicy(
            Boolean autoJoinEnabled,
            Boolean interclubRecruitmentOpen,
            Boolean memberRecruitmentOpen,
            String memberRecruitmentNote
    ) {
        if (autoJoinEnabled != null) {
            this.autoJoinEnabled = autoJoinEnabled;
        }
        if (interclubRecruitmentOpen != null) {
            this.interclubRecruitmentOpen = interclubRecruitmentOpen;
        }
        if (memberRecruitmentOpen != null) {
            this.memberRecruitmentOpen = memberRecruitmentOpen;
        }
        this.memberRecruitmentNote = memberRecruitmentNote;
    }

    /**
     * 어워드 정책 업데이트
     */
    public void updateAwardPolicy(
            Boolean awardEnabled,
            AwardPeriod awardPeriod,
            Boolean awardAttendanceEnabled,
            Boolean awardPointsEnabled,
            Boolean awardBookingEnabled
    ) {
        if (awardEnabled != null) {
            this.awardEnabled = awardEnabled;
        }
        if (awardPeriod != null) {
            this.awardPeriod = awardPeriod;
        }
        if (awardAttendanceEnabled != null) {
            this.awardAttendanceEnabled = awardAttendanceEnabled;
        }
        if (awardPointsEnabled != null) {
            this.awardPointsEnabled = awardPointsEnabled;
        }
        if (awardBookingEnabled != null) {
            this.awardBookingEnabled = awardBookingEnabled;
        }
    }
}
