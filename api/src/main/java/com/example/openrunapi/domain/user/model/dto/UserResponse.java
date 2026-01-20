package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.ContactVisibility;
import com.example.openrunapi.domain.user.model.Gender;
import com.example.openrunapi.domain.user.model.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private final Long id;
    private final String email;
    private final String name;
    private final String imageUrl;
    private final String phoneNumber;
    private final ContactVisibility phoneVisibility;
    private final ContactVisibility emailVisibility;
    private final Gender gender;
    private final LocalDateTime createdAt;
    private final String lastLoginProvider;
    private final LocalDateTime lastLoginAt;

    public UserResponse(Long id, String email, String name, String imageUrl, String phoneNumber,
                       ContactVisibility phoneVisibility, ContactVisibility emailVisibility, Gender gender,
                       LocalDateTime createdAt, String lastLoginProvider, LocalDateTime lastLoginAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.imageUrl = imageUrl;
        this.phoneNumber = phoneNumber;
        this.phoneVisibility = phoneVisibility;
        this.emailVisibility = emailVisibility;
        this.gender = gender;
        this.createdAt = createdAt;
        this.lastLoginProvider = lastLoginProvider;
        this.lastLoginAt = lastLoginAt;
    }

    /**
     * User 엔티티로부터 기본 UserResponse 생성 (모든 정보 포함)
     */
    public UserResponse(User user) {
        this(user.getId(), user.getEmail(), user.getName(), user.getImageUrl(),
             user.getPhoneNumber(), user.getPhoneVisibility(), user.getEmailVisibility(), user.getGender(),
             user.getCreatedAt(), user.getLastLoginProvider(), user.getLastLoginAt());
    }

    /**
     * 공개범위에 따라 연락처 정보를 필터링한 UserResponse 생성
     * @param user 대상 사용자
     * @param requesterId 요청자 ID (null이면 비로그인 사용자)
     * @param isSameClub 같은 클럽 멤버 여부
     */
    public static UserResponse withVisibilityFilter(User user, Long requesterId, boolean isSameClub) {
        // 본인이면 모든 정보 포함
        if (requesterId != null && user.getId().equals(requesterId)) {
            return new UserResponse(user);
        }

        // 공개범위에 따라 필터링
        String filteredEmail = shouldShowEmail(user.getEmailVisibility(), isSameClub) ? user.getEmail() : null;
        String filteredPhone = shouldShowPhone(user.getPhoneVisibility(), isSameClub) ? user.getPhoneNumber() : null;

        return UserResponse.builder()
                .id(user.getId())
                .email(filteredEmail)
                .name(user.getName())
                .imageUrl(user.getImageUrl())
                .phoneNumber(filteredPhone)
                .phoneVisibility(user.getPhoneVisibility())
                .emailVisibility(user.getEmailVisibility())
                .gender(user.getGender())
                .createdAt(user.getCreatedAt())
                .lastLoginProvider(user.getLastLoginProvider())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    private static boolean shouldShowEmail(ContactVisibility visibility, boolean isSameClub) {
        // PUBLIC: 클럽원 및 게스트 참여 시 공유
        if (visibility == null || visibility == ContactVisibility.PUBLIC) return isSameClub;
        return false; // PRIVATE
    }

    private static boolean shouldShowPhone(ContactVisibility visibility, boolean isSameClub) {
        // PUBLIC: 클럽원 및 게스트 참여 시 공유
        if (visibility == null || visibility == ContactVisibility.PUBLIC) return isSameClub;
        return false; // PRIVATE
    }
}
