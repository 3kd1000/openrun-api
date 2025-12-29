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

/**
 * WebAuthn 인증 정보 엔티티
 * 생체인증(Face ID, Touch ID, 지문 등)을 위한 credential 저장
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "webauthn_credentials", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_credential_id", columnList = "credential_id", unique = true)
})
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * WebAuthn Credential ID (Base64URL encoded)
     * 각 인증기마다 고유한 ID
     */
    @Column(name = "credential_id", nullable = false, unique = true, length = 1024)
    private String credentialId;

    /**
     * Public Key (Base64URL encoded)
     * 서버에서 검증에 사용
     */
    @Column(name = "public_key", nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    /**
     * Signature Counter
     * Replay attack 방지를 위한 카운터
     */
    @Column(name = "sign_count", nullable = false)
    private Long signCount = 0L;

    /**
     * Authenticator Attestation GUID
     * 인증기의 고유 식별자
     */
    @Column(name = "aaguid", length = 36)
    private String aaguid;

    /**
     * Transports (USB, NFC, BLE, internal)
     * 콤마로 구분된 문자열
     */
    @Column(name = "transports", length = 255)
    private String transports;

    /**
     * 사용자가 지정한 기기 이름
     * 예: "iPhone 15 Pro", "MacBook Pro Touch ID"
     */
    @Column(name = "device_name", length = 100)
    private String deviceName;

    /**
     * Credential 타입 (public-key)
     */
    @Column(name = "credential_type", length = 50)
    private String credentialType = "public-key";

    /**
     * 마지막 사용 시간
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public WebAuthnCredential(User user, String credentialId, String publicKey, Long signCount,
                              String aaguid, String transports, String deviceName) {
        this.user = user;
        this.credentialId = credentialId;
        this.publicKey = publicKey;
        this.signCount = signCount != null ? signCount : 0L;
        this.aaguid = aaguid;
        this.transports = transports;
        this.deviceName = deviceName;
        this.credentialType = "public-key";
    }

    /**
     * 인증 성공 시 호출
     * - signCount 업데이트
     * - lastUsedAt 업데이트
     */
    public void updateOnSuccessfulAuth(Long newSignCount) {
        this.signCount = newSignCount;
        this.lastUsedAt = LocalDateTime.now();
    }

    /**
     * 기기 이름 변경
     */
    public void updateDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }
}
