package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.WebAuthnCredential;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * WebAuthn Credential 응답 DTO
 */
@Getter
@Builder
public class WebAuthnCredentialResponse {

    private Long id;
    private String deviceName;
    private String transports;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;

    public static WebAuthnCredentialResponse from(WebAuthnCredential credential) {
        return WebAuthnCredentialResponse.builder()
                .id(credential.getId())
                .deviceName(credential.getDeviceName())
                .transports(credential.getTransports())
                .createdAt(credential.getCreatedAt())
                .lastUsedAt(credential.getLastUsedAt())
                .build();
    }
}
