package com.example.openrunapi.domain.user.service;

import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import com.example.openrunapi.domain.user.model.WebAuthnCredential;
import com.example.openrunapi.domain.user.model.dto.*;
import com.example.openrunapi.domain.user.repository.UserRepository;
import com.example.openrunapi.domain.user.repository.WebAuthnCredentialRepository;
import com.webauthn4j.data.PublicKeyCredentialParameters;
import com.webauthn4j.data.PublicKeyCredentialType;
import com.webauthn4j.data.attestation.statement.COSEAlgorithmIdentifier;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class WebAuthnService {

    private final UserRepository userRepository;
    private final WebAuthnCredentialRepository credentialRepository;

    @Value("${webauthn.rp-id:localhost}")
    private String rpId;

    @Value("${webauthn.rp-name:OpenRun}")
    private String rpName;

    @Value("${webauthn.timeout:60000}")
    private Long timeout;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * 등록 시작 - Challenge 생성
     */
    public WebAuthnChallengeResponse initiateRegistration(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        byte[] challenge = new byte[32];
        secureRandom.nextBytes(challenge);
        String challengeBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(challenge);

        String userIdBase64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(user.getId().toString().getBytes(StandardCharsets.UTF_8));

        return WebAuthnChallengeResponse.builder()
                .challenge(challengeBase64)
                .rpId(rpId)
                .rpName(rpName)
                .userId(userIdBase64)
                .userName(user.getEmail())
                .userDisplayName(user.getName())
                .timeout(timeout)
                .build();
    }

    /**
     * 등록 완료 - Credential 저장
     */
    @Transactional
    public WebAuthnCredentialResponse completeRegistration(Long userId, WebAuthnRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        // 이미 등록된 Credential인지 확인
        if (credentialRepository.findByCredentialId(request.getCredentialId()).isPresent()) {
            throw new IllegalStateException("이미 등록된 인증기입니다.");
        }

        // TODO: webauthn4j로 attestation 검증 추가 (간단하게 스킵)

        String transports = request.getTransports() != null
                ? String.join(",", request.getTransports())
                : null;

        WebAuthnCredential credential = WebAuthnCredential.builder()
                .user(user)
                .credentialId(request.getCredentialId())
                .publicKey(request.getPublicKey())
                .signCount(0L)
                .transports(transports)
                .deviceName(request.getDeviceName())
                .build();

        credentialRepository.save(credential);

        return WebAuthnCredentialResponse.from(credential);
    }

    /**
     * 인증 시작 - Challenge 생성
     */
    public WebAuthnChallengeResponse initiateAuthentication(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        byte[] challenge = new byte[32];
        secureRandom.nextBytes(challenge);
        String challengeBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(challenge);

        String userIdBase64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(user.getId().toString().getBytes(StandardCharsets.UTF_8));

        return WebAuthnChallengeResponse.builder()
                .challenge(challengeBase64)
                .rpId(rpId)
                .rpName(rpName)
                .userId(userIdBase64)
                .userName(user.getEmail())
                .userDisplayName(user.getName())
                .timeout(timeout)
                .build();
    }

    /**
     * 인증 완료 - Signature 검증
     */
    @Transactional
    public boolean completeAuthentication(Long userId, WebAuthnAuthenticationRequest request) {
        WebAuthnCredential credential = credentialRepository.findByCredentialId(request.getCredentialId())
                .orElseThrow(() -> new EntityNotFoundException("인증기를 찾을 수 없습니다."));

        // 사용자 소유 확인
        if (!credential.getUser().getId().equals(userId)) {
            throw new IllegalStateException("인증기 소유자가 일치하지 않습니다.");
        }

        // TODO: webauthn4j로 signature 검증 추가 (간단하게 스킵)
        // TODO: signCount 증가 확인 (replay attack 방지)

        // 인증 성공 처리
        credential.updateOnSuccessfulAuth(credential.getSignCount() + 1);

        return true;
    }

    /**
     * 로그인용 인증 - Credential ID로 사용자 찾고 인증 처리
     * OAuth 없이 WebAuthn만으로 로그인할 때 사용
     *
     * @return WebAuthnLoginDto - 필요한 정보만 담은 DTO (lazy loading 방지)
     */
    @Transactional
    public WebAuthnLoginDto authenticateAndGetUser(WebAuthnAuthenticationRequest request) {
        WebAuthnCredential credential = credentialRepository.findByCredentialId(request.getCredentialId())
                .orElseThrow(() -> new EntityNotFoundException("등록되지 않은 인증기입니다."));

        // TODO: webauthn4j로 signature 검증 추가 (간단하게 스킵)
        // TODO: signCount 증가 확인 (replay attack 방지)

        // 인증 성공 처리
        credential.updateOnSuccessfulAuth(credential.getSignCount() + 1);

        User user = credential.getUser();

        // OAuth Provider 정보 조회 (트랜잭션 내에서)
        String firebaseUid = user.getOauthProviders().stream()
                .findFirst()
                .map(UserOAuthProvider::getProviderUid)
                .orElseThrow(() -> new IllegalStateException("사용자의 OAuth 정보가 없습니다."));

        // DTO로 변환하여 반환 (엔티티 detach)
        return new WebAuthnLoginDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                firebaseUid
        );
    }

    /**
     * WebAuthn 로그인 결과 DTO (내부용)
     * Controller에 User 엔티티를 직접 전달하지 않아 lazy loading 문제 방지
     */
    public static class WebAuthnLoginDto {
        private final Long userId;
        private final String userName;
        private final String userEmail;
        private final String firebaseUid;

        public WebAuthnLoginDto(Long userId, String userName, String userEmail, String firebaseUid) {
            this.userId = userId;
            this.userName = userName;
            this.userEmail = userEmail;
            this.firebaseUid = firebaseUid;
        }

        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getUserEmail() { return userEmail; }
        public String getFirebaseUid() { return firebaseUid; }
    }

    /**
     * 사용자의 모든 Credential 조회
     */
    public List<WebAuthnCredentialResponse> getUserCredentials(Long userId) {
        List<WebAuthnCredential> credentials = credentialRepository.findByUserId(userId);
        return credentials.stream()
                .map(WebAuthnCredentialResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Credential 삭제
     */
    @Transactional
    public void deleteCredential(Long userId, Long credentialId) {
        WebAuthnCredential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new EntityNotFoundException("인증기를 찾을 수 없습니다."));

        if (!credential.getUser().getId().equals(userId)) {
            throw new IllegalStateException("인증기 소유자가 일치하지 않습니다.");
        }

        credentialRepository.delete(credential);
    }

    /**
     * 사용자가 WebAuthn을 등록했는지 확인
     */
    public boolean hasCredentials(Long userId) {
        return credentialRepository.countByUserId(userId) > 0;
    }
}
