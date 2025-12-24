package com.example.openrunapi.domain.auth.service;

import com.example.openrunapi.domain.auth.model.dto.UserCreationResult;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import com.example.openrunapi.domain.user.repository.UserOAuthProviderRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuthService {

    private final UserRepository userRepository;
    private final UserOAuthProviderRepository oauthProviderRepository;

    /**
     * OAuth 로그인 처리 (email 기반 통합 계정)
     *
     * 1. OAuth Provider로 먼저 검색 (재로그인 케이스)
     * 2. 없으면 email로 User 검색
     * 3. User가 있으면 OAuth Provider 정보만 추가
     * 4. User도 없으면 신규 User + OAuth Provider 생성
     *
     * @return UserCreationResult (User + isNewUser 플래그)
     */
    @Transactional
    public UserCreationResult getOrCreateUser(
            UserOAuthProvider.OAuthProviderType providerType,
            String providerUid,
            String email,
            String name,
            String imageUrl
    ) {
        // 1. OAuth Provider로 먼저 검색 (빠른 재로그인)
        Optional<UserOAuthProvider> existingProvider = oauthProviderRepository
                .findByProviderAndProviderUid(providerType, providerUid);

        if (existingProvider.isPresent()) {
            User user = existingProvider.get().getUser();
            log.info("✅ 기존 OAuth 유저 재로그인: {} (provider={})", user.getName(), providerType);
            return new UserCreationResult(user, false); // 기존 사용자
        }

        // 2. email로 User 검색 (다른 OAuth로 가입했을 수 있음)
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();

            // 이미 이 Provider로 등록되어 있는지 확인
            Optional<UserOAuthProvider> userProvider = oauthProviderRepository
                    .findByUserIdAndProvider(user.getId(), providerType);

            if (userProvider.isEmpty()) {
                // 새로운 OAuth Provider 추가 (예: Google로 가입 → Kakao 추가)
                UserOAuthProvider newProvider = UserOAuthProvider.builder()
                        .user(user)
                        .provider(providerType)
                        .providerUid(providerUid)
                        .build();
                oauthProviderRepository.save(newProvider);

                log.info("✅ 기존 유저에 새 OAuth Provider 추가: {} (provider={})", user.getName(), providerType);
            }

            // 기존 사용자는 name을 유지 (이미 SetupProfile에서 설정 완료)
            // imageUrl만 최신 정보로 업데이트 (프로필 이미지는 변경될 수 있음)
            if (imageUrl != null && !imageUrl.isEmpty()) {
                user.updateProfile(user.getName(), imageUrl);
            }

            return new UserCreationResult(user, false); // 기존 사용자 + OAuth Provider 추가
        }

        // 3. 신규 User + OAuth Provider 생성
        User newUser = User.builder()
                .email(email)
                .name(name)
                .imageUrl(imageUrl)
                .isGuest(false)
                .build();
        User savedUser = userRepository.save(newUser);

        UserOAuthProvider newProvider = UserOAuthProvider.builder()
                .user(savedUser)
                .provider(providerType)
                .providerUid(providerUid)
                .build();
        oauthProviderRepository.save(newProvider);

        log.info("✅ 신규 유저 생성: {} (provider={})", savedUser.getName(), providerType);

        return new UserCreationResult(savedUser, true); // 신규 사용자
    }

    /**
     * OAuth Provider로 User 조회
     */
    public Optional<User> findUserByOAuthProvider(
            UserOAuthProvider.OAuthProviderType providerType,
            String providerUid
    ) {
        return oauthProviderRepository
                .findByProviderAndProviderUid(providerType, providerUid)
                .map(UserOAuthProvider::getUser);
    }

    /**
     * Provider 구분 없이 provider_uid로 User 조회 (Firebase uid 검색용)
     */
    public Optional<User> findUserByProviderUid(String providerUid) {
        return oauthProviderRepository
                .findByProviderUid(providerUid)
                .map(UserOAuthProvider::getUser);
    }
}
