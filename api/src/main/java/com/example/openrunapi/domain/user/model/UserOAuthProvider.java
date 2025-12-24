package com.example.openrunapi.domain.user.model;

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
@Table(name = "user_oauth_providers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_uid"}),
        @UniqueConstraint(columnNames = {"user_id", "provider"})
})
public class UserOAuthProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private OAuthProviderType provider;

    @Column(name = "provider_uid", nullable = false)
    private String providerUid;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public UserOAuthProvider(User user, OAuthProviderType provider, String providerUid) {
        this.user = user;
        this.provider = provider;
        this.providerUid = providerUid;
    }

    public enum OAuthProviderType {
        GOOGLE,
        KAKAO,
        NAVER
    }
}
