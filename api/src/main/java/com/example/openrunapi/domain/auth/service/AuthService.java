package com.example.openrunapi.domain.auth.service;

import com.example.openrunapi.domain.auth.model.dto.KakaoUserInfo;
import com.example.openrunapi.domain.auth.model.dto.LoginResponse;
import com.example.openrunapi.domain.user.model.User;
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

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
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
    public LoginResponse kakaoLogin(String code) {
        String accessToken = getKakaoAccessToken(code);
        KakaoUserInfo kakaoUserInfo = getKakaoUserInfo(accessToken);

        User user = saveOrUpdateUser(kakaoUserInfo);

        try {
            String firebaseCustomToken = firebaseAuth.createCustomToken(user.getFirebaseUid());
            return new LoginResponse(firebaseCustomToken);
        } catch (FirebaseAuthException e) {
            log.error("Firebase custom token creation failed for UID: {}", user.getFirebaseUid(), e);
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

    private User saveOrUpdateUser(KakaoUserInfo kakaoUserInfo) {
        Optional<User> existingUser = userRepository.findBySocialId(String.valueOf(kakaoUserInfo.getSocialId()));

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.updateProfile(kakaoUserInfo.getName(), kakaoUserInfo.getImageUrl()); // imageUrl 파라미터에 null 전달
            return user;
        } else {
            String firebaseUid;
            try {
                firebaseUid = firebaseAuth.createUser(new UserRecord.CreateRequest()).getUid();
            } catch (FirebaseAuthException e) {
                log.error("Failed to create Firebase user.", e);
                throw new RuntimeException("Firebase 사용자 생성에 실패했습니다.");
            }

            // 카카오에서 받은 정보가 null일 경우 기본값 설정
            String name = Optional.ofNullable(kakaoUserInfo.getName()).orElse("카카오 사용자");
            String email = Optional.ofNullable(kakaoUserInfo.getEmail()).orElse(firebaseUid + "@kakao.com");
            String imageUrl = kakaoUserInfo.getImageUrl(); // 이미지 URL은 null 허용

            User newUser = User.builder()
                    .firebaseUid(firebaseUid)
                    .socialId(String.valueOf(kakaoUserInfo.getSocialId()))
                    .name(name)
                    .email(email)
                    .imageUrl(imageUrl)
                    .build();

            return userRepository.save(newUser);
        }
    }

    // KakaoUserInfo에 imageUrl 필드 추가 (없을 경우 null 반환)
    private String getImageUrl(KakaoUserInfo kakaoUserInfo) {
        if (kakaoUserInfo.getKakaoAccount() != null && kakaoUserInfo.getKakaoAccount().getProfile() != null) {
            return kakaoUserInfo.getKakaoAccount().getProfile().getProfileImageUrl(); // 카카오 프로필 이미지 URL 필드명 확인 필요
        }
        return null;
    }
}