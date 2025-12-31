package com.example.openrunapi.domain.user.controller;

import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import com.example.openrunapi.domain.user.model.dto.*;
import com.example.openrunapi.domain.user.service.WebAuthnService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webauthn")
@RequiredArgsConstructor
public class WebAuthnController {

    private final WebAuthnService webAuthnService;
    private final OAuthService oauthService;

    /**
     * 등록 시작 - Challenge 생성
     */
    @PostMapping("/register/options")
    public ResponseEntity<WebAuthnChallengeResponse> getRegisterOptionsForCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getCurrentUser(userDetails);
        WebAuthnChallengeResponse response = webAuthnService.initiateRegistration(user.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 등록 완료 - Credential 저장
     */
    @PostMapping("/register")
    public ResponseEntity<WebAuthnCredentialResponse> registerCredential(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody WebAuthnRegistrationRequest request
    ) {
        User user = getCurrentUser(userDetails);
        WebAuthnCredentialResponse response = webAuthnService.completeRegistration(user.getId(), request);
        log.info("✅ 신규 WebAuthn 등록: {} (userId={})", user.getName(), user.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 인증 시작 - Challenge 생성
     */
    @PostMapping("/authenticate/options")
    public ResponseEntity<WebAuthnChallengeResponse> getAuthenticationOptionsForCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getCurrentUser(userDetails);
        WebAuthnChallengeResponse response = webAuthnService.initiateAuthentication(user.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 인증 완료 - Signature 검증
     */
    @PostMapping("/authenticate")
    public ResponseEntity<Map<String, Boolean>> authenticateCredential(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody WebAuthnAuthenticationRequest request
    ) {
        User user = getCurrentUser(userDetails);
        boolean success = webAuthnService.completeAuthentication(user.getId(), request);
        return ResponseEntity.ok(Map.of("success", success));
    }

    /**
     * 사용자의 모든 Credential 조회
     */
    @GetMapping("/credentials")
    public ResponseEntity<List<WebAuthnCredentialResponse>> getUserCredentials(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getCurrentUser(userDetails);
        List<WebAuthnCredentialResponse> credentials = webAuthnService.getUserCredentials(user.getId());
        return ResponseEntity.ok(credentials);
    }

    /**
     * Credential 삭제
     */
    @DeleteMapping("/credentials/{credentialId}")
    public ResponseEntity<Void> deleteCredential(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long credentialId
    ) {
        User user = getCurrentUser(userDetails);
        webAuthnService.deleteCredential(user.getId(), credentialId);
        return ResponseEntity.noContent().build();
    }

    /**
     * WebAuthn 등록 여부 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getWebAuthnStatus(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getCurrentUser(userDetails);
        boolean hasCredentials = webAuthnService.hasCredentials(user.getId());
        return ResponseEntity.ok(Map.of("hasWebAuthn", hasCredentials));
    }

    /**
     * WebAuthn만으로 로그인 (인증 불필요한 public 엔드포인트)
     * OAuth 없이 생체인증만으로 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<WebAuthnLoginResponse> loginWithWebAuthn(
            @RequestBody WebAuthnAuthenticationRequest request
    ) {
        try {
            // 1. WebAuthn 인증 및 사용자 정보 조회
            WebAuthnService.WebAuthnLoginDto loginDto = webAuthnService.authenticateAndGetUser(request);

            // 2. 로그인 성공 로그
            log.info("✅ 기존 WebAuthn으로 재로그인: {} (userId={})", loginDto.getUserName(), loginDto.getUserId());

            // 3. Firebase Custom Token 생성
            String customToken = FirebaseAuth.getInstance().createCustomToken(loginDto.getFirebaseUid());

            // 4. 응답 DTO 생성
            WebAuthnLoginResponse response = WebAuthnLoginResponse.builder()
                    .customToken(customToken)
                    .userId(loginDto.getUserId())
                    .userName(loginDto.getUserName())
                    .email(loginDto.getUserEmail())
                    .build();

            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            log.error("❌ [WebAuthn Login Failed] Firebase Custom Token 생성 실패", e);
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("❌ [WebAuthn Login Failed] 예상치 못한 오류 발생", e);
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * UserDetails에서 User 엔티티 조회
     */
    private User getCurrentUser(UserDetails userDetails) {
        return oauthService.findUserByProviderUid(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uid: " + userDetails.getUsername()));
    }
}
