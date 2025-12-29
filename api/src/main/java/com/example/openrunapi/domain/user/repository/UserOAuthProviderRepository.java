package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserOAuthProviderRepository extends JpaRepository<UserOAuthProvider, Long> {

    /**
     * OAuth 제공자와 제공자 UID로 조회
     */
    Optional<UserOAuthProvider> findByProviderAndProviderUid(
            UserOAuthProvider.OAuthProviderType provider,
            String providerUid
    );

    /**
     * 특정 유저의 특정 OAuth 제공자 정보 조회
     */
    Optional<UserOAuthProvider> findByUserIdAndProvider(
            Long userId,
            UserOAuthProvider.OAuthProviderType provider
    );

    /**
     * Provider 구분 없이 provider_uid로 조회 (Firebase uid 검색용)
     */
    Optional<UserOAuthProvider> findByProviderUid(String providerUid);
}
