package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.club.model.AwardPeriod;
import com.example.openrunapi.domain.club.model.ClubPolicy;
import lombok.Builder;
import lombok.Getter;

/**
 * ClubPolicy 엔티티의 Audit용 스냅샷 DTO
 */
@Getter
@Builder
public class ClubPolicyAuditSnapshot {
    private Long id;
    private Long clubId;

    // 기본 정책 필드
    private Boolean autoJoinEnabled;
    private Boolean interclubRecruitmentOpen;
    private Boolean memberRecruitmentOpen;
    private String memberRecruitmentNote;

    // 어워드 정책 필드
    private AwardPeriod awardPeriod;
    private Boolean awardAttendanceEnabled;
    private Boolean awardPointsEnabled;
    private Boolean awardBookingEnabled;

    public static ClubPolicyAuditSnapshot from(ClubPolicy policy) {
        if (policy == null) {
            return null;
        }
        return ClubPolicyAuditSnapshot.builder()
                .id(policy.getId())
                .clubId(policy.getClubId())
                .autoJoinEnabled(policy.getAutoJoinEnabled())
                .interclubRecruitmentOpen(policy.getInterclubRecruitmentOpen())
                .memberRecruitmentOpen(policy.getMemberRecruitmentOpen())
                .memberRecruitmentNote(policy.getMemberRecruitmentNote())
                .awardPeriod(policy.getAwardPeriod())
                .awardAttendanceEnabled(policy.getAwardAttendanceEnabled())
                .awardPointsEnabled(policy.getAwardPointsEnabled())
                .awardBookingEnabled(policy.getAwardBookingEnabled())
                .build();
    }
}
