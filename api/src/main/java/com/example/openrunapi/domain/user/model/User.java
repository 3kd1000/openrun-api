package com.example.openrunapi.domain.user.model;

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
    private String email; // 이메일 (OAuth 통합 계정의 기준)

    @Column(nullable = false)
    private String name; // 사용자 이름 또는 닉네임

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

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
}
