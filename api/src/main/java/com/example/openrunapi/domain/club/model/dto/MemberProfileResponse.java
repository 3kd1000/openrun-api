package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubRole;
import com.example.openrunapi.domain.user.model.ContactVisibility;
import com.example.openrunapi.domain.user.model.Gender;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserProfile;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 클럽 멤버 프로필 응답 DTO
 * - User 기본 정보 + UserProfile(테니스 정보) + ClubMember(클럽 내 역할/가입일)
 * - 연락처 정보는 ContactVisibility에 따라 필터링
 */
@Getter
public class MemberProfileResponse {

    // User 기본 정보
    private final Long id;
    private final String name;
    private final String email;           // 공개범위에 따라 null 가능
    private final String imageUrl;
    private final String phoneNumber;     // 공개범위에 따라 null 가능
    private final Gender gender;
    private final String birthDate;       // 공개범위에 따라 null 가능 (YYMMDD)
    private final String regionDepth1;    // 지역 (시/도)
    private final String regionDepth2;    // 지역 (시/군/구)

    // Tennis Profile (user_profile)
    private final LocalDate tennisStartedAt;
    private final String ntrp;
    private final String tournamentHistory;
    private final boolean formerPlayer;

    // Club Membership 정보
    private final ClubRole role;
    private final LocalDateTime joinedAt;

    /**
     * 클럽 멤버 프로필 응답 생성
     * @param user 사용자 정보
     * @param userProfile 사용자 테니스 프로필 (nullable)
     * @param clubMember 클럽 멤버십 정보
     * @param isSameClub 조회자와 같은 클럽 멤버인지 여부 (연락처 공개 범위 판단용)
     */
    public MemberProfileResponse(User user, UserProfile userProfile, ClubMember clubMember, boolean isSameClub) {
        this.id = user.getId();
        this.name = user.getName();
        this.imageUrl = user.getImageUrl();
        this.gender = user.getGender();

        // 연락처 공개 범위에 따라 필터링
        this.email = shouldShowEmail(user.getEmailVisibility(), isSameClub) ? user.getEmail() : null;
        this.phoneNumber = shouldShowPhone(user.getPhoneVisibility(), isSameClub) ? user.getPhoneNumber() : null;
        this.birthDate = shouldShowBirthDate(user.getBirthDateVisibility(), isSameClub) ? user.getBirthDate() : null;

        // 지역 정보 (항상 공개)
        this.regionDepth1 = user.getRegionDepth1();
        this.regionDepth2 = user.getRegionDepth2();

        // Tennis Profile (없으면 기본값)
        if (userProfile != null) {
            this.tennisStartedAt = userProfile.getTennisStartedAt();
            this.ntrp = userProfile.getNtrp();
            this.tournamentHistory = userProfile.getTournamentHistory();
            this.formerPlayer = userProfile.isFormerPlayer();
        } else {
            this.tennisStartedAt = null;
            this.ntrp = null;
            this.tournamentHistory = null;
            this.formerPlayer = false;
        }

        // Club Membership 정보
        this.role = clubMember.getRole();
        this.joinedAt = clubMember.getJoinedAt();
    }

    /**
     * 이메일 공개 여부 판단
     * - PUBLIC: 같은 클럽 멤버에게 공개
     * - PRIVATE: 비공개
     */
    private static boolean shouldShowEmail(ContactVisibility visibility, boolean isSameClub) {
        if (visibility == null || visibility == ContactVisibility.PUBLIC) {
            return isSameClub;
        }
        return false; // PRIVATE
    }

    /**
     * 전화번호 공개 여부 판단
     * - PUBLIC: 같은 클럽 멤버에게 공개
     * - PRIVATE: 비공개
     */
    private static boolean shouldShowPhone(ContactVisibility visibility, boolean isSameClub) {
        if (visibility == null || visibility == ContactVisibility.PUBLIC) {
            return isSameClub;
        }
        return false; // PRIVATE
    }

    /**
     * 생년월일 공개 여부 판단
     * - PUBLIC: 같은 클럽 멤버에게 공개
     * - PRIVATE: 비공개
     */
    private static boolean shouldShowBirthDate(ContactVisibility visibility, boolean isSameClub) {
        if (visibility == null || visibility == ContactVisibility.PUBLIC) {
            return isSameClub;
        }
        return false; // PRIVATE
    }
}
