package com.example.openrunapi.domain.user.model;

import com.example.openrunapi.common.converter.EncryptedStringConverter;
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
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE users SET deleted = true, email = CONCAT('deleted_', id, '_', email) WHERE id = ?")
@SQLRestriction("deleted = false")
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email; // 이메일 (OAuth 통합 계정의 기준, 평문 저장 - 검색용)

    @Column(nullable = false)
    private String name; // 사용자 이름 또는 닉네임

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "phone_number")
    private String phoneNumber; // 연락처 (암호화 저장)

    @Enumerated(EnumType.STRING)
    @Column(name = "phone_visibility", length = 20)
    private ContactVisibility phoneVisibility = ContactVisibility.PUBLIC; // 연락처 공개 범위

    @Enumerated(EnumType.STRING)
    @Column(name = "email_visibility", length = 20)
    private ContactVisibility emailVisibility = ContactVisibility.PUBLIC; // 이메일 공개 범위

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10, nullable = false)
    private Gender gender = Gender.PRIVATE; // 성별 (MALE, FEMALE, PRIVATE)

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "birth_date")
    private String birthDate; // 생년월일 (YYMMDD 형식, 암호화 저장)

    @Enumerated(EnumType.STRING)
    @Column(name = "birth_date_visibility", length = 20)
    private ContactVisibility birthDateVisibility = ContactVisibility.PRIVATE; // 생년월일 공개 범위 (기본: 비공개)

    @Column(name = "is_guest", nullable = false)
    private boolean isGuest = false; // 게스트 사용자 여부 (스코어보드 집계 제외)

    private boolean deleted = false;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserOAuthProvider> oauthProviders = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_login_provider", length = 20)
    private String lastLoginProvider; // 마지막 로그인 수단 (GOOGLE, KAKAO, NAVER)

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt; // 마지막 로그인 시각

    @Column(name = "region_depth1", length = 20)
    private String regionDepth1; // 시/도 (예: 서울특별시, 경기도)

    @Column(name = "region_depth2", length = 20)
    private String regionDepth2; // 시/군/구 (예: 강남구, 수원시)

    @Builder
    public User(String email, String name, String imageUrl, Boolean isGuest) {
        this.email = email;
        this.name = name;
        this.imageUrl = imageUrl;
        this.isGuest = isGuest != null ? isGuest : false;
    }

    public void updateProfile(String name, String imageUrl) {
        if (name != null) {
            this.name = name;
        }
        this.imageUrl = imageUrl; // null이 들어와도 업데이트 가능
    }

    public void updateGender(Gender gender) {
        if (gender != null) {
            this.gender = gender;
        }
    }

    public void updateContactInfo(String phoneNumber, ContactVisibility phoneVisibility, ContactVisibility emailVisibility) {
        this.phoneNumber = phoneNumber; // null이 들어와도 업데이트 가능
        if (phoneVisibility != null) {
            this.phoneVisibility = phoneVisibility;
        }
        if (emailVisibility != null) {
            this.emailVisibility = emailVisibility;
        }
    }

    public void updateBirthDateInfo(String birthDate, ContactVisibility birthDateVisibility) {
        this.birthDate = birthDate; // null이 들어와도 업데이트 가능
        if (birthDateVisibility != null) {
            this.birthDateVisibility = birthDateVisibility;
        }
    }

    /**
     * 마지막 로그인 정보 업데이트
     */
    public void updateLastLogin(String provider, LocalDateTime loginTime) {
        this.lastLoginProvider = provider;
        this.lastLoginAt = loginTime;
    }

    /**
     * OAuth Provider 정보 추가
     */
    public void addOAuthProvider(UserOAuthProvider provider) {
        this.oauthProviders.add(provider);
    }

    /**
     * 특정 OAuth Provider 정보 조회
     */
    public UserOAuthProvider getOAuthProvider(UserOAuthProvider.OAuthProviderType providerType) {
        return this.oauthProviders.stream()
                .filter(p -> p.getProvider() == providerType)
                .findFirst()
                .orElse(null);
    }

    /**
     * 지역 정보 업데이트
     */
    public void updateRegion(String regionDepth1, String regionDepth2) {
        this.regionDepth1 = regionDepth1;
        this.regionDepth2 = regionDepth2;
    }

    /**
     * 지역 표시용 문자열 반환
     */
    public String getRegionDisplay() {
        if (regionDepth1 != null && !regionDepth1.isEmpty()) {
            if (regionDepth2 != null && !regionDepth2.isEmpty()) {
                return regionDepth1 + " " + regionDepth2;
            }
            return regionDepth1;
        }
        return null;
    }
}
