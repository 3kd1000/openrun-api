package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubPolicy;
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

    // 기본 정책 필드들 (Boolean 통일)
    private final Boolean autoJoinEnabled;
    private final Boolean interclubRecruitmentOpen;
    private final Boolean memberRecruitmentOpen;
    private final String memberRecruitmentNote;

    private final String activitySummary;
    private final Integer memberCount;
    private final LocalDateTime createdAt;

    // 어워드 정책 필드
    private final String awardPeriod;
    private final Boolean awardAttendanceEnabled;
    private final Boolean awardPointsEnabled;
    private final Boolean awardBookingEnabled;

    /**
     * Club + ClubPolicy를 함께 받는 생성자 (권장)
     */
    public ClubResponse(Club club, ClubPolicy policy) {
        this.id = club.getId();
        this.name = club.getName();
        this.description = club.getDescription();
        this.region = club.getRegionDisplay();
        this.regionDepth1 = club.getRegionDepth1();
        this.regionDepth2 = club.getRegionDepth2();
        this.ownerUserId = club.getOwnerUserId();
        this.activitySummary = club.getActivitySummary();
        this.memberCount = club.getMemberCount();
        this.createdAt = club.getCreatedAt();

        // ClubPolicy에서 정책 정보 가져오기
        if (policy != null) {
            this.autoJoinEnabled = policy.getAutoJoinEnabled();
            this.interclubRecruitmentOpen = policy.getInterclubRecruitmentOpen();
            this.memberRecruitmentOpen = policy.getMemberRecruitmentOpen();
            this.memberRecruitmentNote = policy.getMemberRecruitmentNote();
            this.awardPeriod = policy.getAwardPeriod() != null ? policy.getAwardPeriod().name() : null;
            this.awardAttendanceEnabled = policy.getAwardAttendanceEnabled();
            this.awardPointsEnabled = policy.getAwardPointsEnabled();
            this.awardBookingEnabled = policy.getAwardBookingEnabled();
        } else {
            // ClubPolicy가 없으면 기본값 사용
            this.autoJoinEnabled = false;
            this.interclubRecruitmentOpen = false;
            this.memberRecruitmentOpen = true;
            this.memberRecruitmentNote = null;
            this.awardPeriod = "HALF_YEAR";
            this.awardAttendanceEnabled = true;
            this.awardPointsEnabled = true;
            this.awardBookingEnabled = true;
        }
    }

    /**
     * Club만 받는 생성자 (하위호환성)
     * @deprecated ClubPolicy를 함께 전달하는 생성자 사용 권장
     */
    @Deprecated
    public ClubResponse(Club club) {
        this(club, null);
    }
}
