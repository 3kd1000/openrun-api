package com.example.openrunapi.domain.auth.service;

import com.example.openrunapi.domain.auth.model.dto.KakaoUserInfo;
import com.example.openrunapi.domain.auth.model.dto.LoginResponse;
import com.example.openrunapi.domain.auth.model.dto.UserCreationResult;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import com.example.openrunapi.domain.user.repository.UserOAuthProviderRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final OAuthService oauthService;
    private final UserOAuthProviderRepository oauthProviderRepository;
    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;
    private final WebClient webClient;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String kakaoRedirectUri;
    
    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String kakaoClientSecret;

    @Value("${spring.security.oauth2.client.provider.kakao.token-uri}")
    private String kakaoTokenUri;

    @Value("${spring.security.oauth2.client.provider.kakao.user-info-uri}")
    private String kakaoUserInfoUri;


    @Transactional
    public LoginResponse googleLogin(String idToken) {
        try {
            // 1. Firebase ID Token 검증
            UserRecord userRecord = firebaseAuth.getUser(firebaseAuth.verifyIdToken(idToken).getUid());

            // 2. User 생성 또는 조회
            String email = userRecord.getEmail();
            String name = userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "New User";
            String imageUrl = userRecord.getPhotoUrl();
            String providerUid = userRecord.getUid();

            UserCreationResult result = oauthService.getOrCreateUser(
                    UserOAuthProvider.OAuthProviderType.GOOGLE,
                    providerUid,
                    email,
                    name,
                    imageUrl
            );

            User user = result.getUser();
            boolean isNewUser = result.isNewUser();

            // 3. 마지막 로그인 정보 업데이트
            user.updateLastLogin("GOOGLE", LocalDateTime.now());

            // 4. 이미 Firebase ID Token을 받았으므로 그대로 반환 (CustomToken 불필요)
            return new LoginResponse(idToken, isNewUser);

        } catch (FirebaseAuthException e) {
            log.error("Firebase ID Token verification failed", e);
            throw new RuntimeException("Firebase 인증에 실패했습니다.");
        }
    }

    @Transactional
    public LoginResponse kakaoLogin(String code) {
        String accessToken = getKakaoAccessToken(code);
        KakaoUserInfo kakaoUserInfo = getKakaoUserInfo(accessToken);

        String socialId = String.valueOf(kakaoUserInfo.getSocialId());
        UserCreationResult result = saveOrUpdateUser(kakaoUserInfo);
        User user = result.getUser();
        boolean isNewUser = result.isNewUser();

        // 마지막 로그인 정보 업데이트
        user.updateLastLogin("KAKAO", LocalDateTime.now());

        // UserOAuthProvider에서 provider_uid 조회
        UserOAuthProvider oauthProvider = oauthProviderRepository
                .findByProviderAndProviderUid(UserOAuthProvider.OAuthProviderType.KAKAO, socialId)
                .orElseThrow(() -> new RuntimeException("OAuth Provider 정보를 찾을 수 없습니다."));

        try {
            // provider_uid를 Firebase UID로 사용하여 CustomToken 생성
            String firebaseCustomToken = firebaseAuth.createCustomToken(oauthProvider.getProviderUid());
            return new LoginResponse(firebaseCustomToken, isNewUser);
        } catch (FirebaseAuthException e) {
            log.error("Firebase custom token creation failed for provider UID: {}", oauthProvider.getProviderUid(), e);
            throw new RuntimeException("Firebase 토큰 생성에 실패했습니다.");
        }
    }

    private String getKakaoAccessToken(String code) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", kakaoClientId);
        formData.add("client_secret", kakaoClientSecret);
        formData.add("redirect_uri", kakaoRedirectUri);
        formData.add("code", code);

        Map response = webClient.post()
                .uri(kakaoTokenUri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(formData)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return (String) response.get("access_token");
    }

    private KakaoUserInfo getKakaoUserInfo(String accessToken) {
        return webClient.get()
                .uri(kakaoUserInfoUri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(KakaoUserInfo.class)
                .block();
    }

    private UserCreationResult saveOrUpdateUser(KakaoUserInfo kakaoUserInfo) {
        // 카카오에서 받은 정보가 null일 경우 기본값 설정
        String name = Optional.ofNullable(kakaoUserInfo.getName()).orElse("카카오 사용자");
        String email = Optional.ofNullable(kakaoUserInfo.getEmail())
                .orElse("kakao_" + kakaoUserInfo.getSocialId() + "@kakao.com");
        String imageUrl = kakaoUserInfo.getImageUrl(); // 이미지 URL은 null 허용
        String socialId = String.valueOf(kakaoUserInfo.getSocialId());

        // OAuthService를 사용하여 email 기반 통합 계정 관리
        return oauthService.getOrCreateUser(
                UserOAuthProvider.OAuthProviderType.KAKAO,
                socialId,
                email,
                name,
                imageUrl
        );
    }

    // KakaoUserInfo에 imageUrl 필드 추가 (없을 경우 null 반환)
    private String getImageUrl(KakaoUserInfo kakaoUserInfo) {
        if (kakaoUserInfo.getKakaoAccount() != null && kakaoUserInfo.getKakaoAccount().getProfile() != null) {
            return kakaoUserInfo.getKakaoAccount().getProfile().getProfileImageUrl(); // 카카오 프로필 이미지 URL 필드명 확인 필요
        }
        return null;
    }
}