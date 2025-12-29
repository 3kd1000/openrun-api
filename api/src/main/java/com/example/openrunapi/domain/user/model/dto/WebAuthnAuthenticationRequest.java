package com.example.openrunapi.domain.user.model.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * WebAuthn 인증 요청 DTO
 * 프론트엔드에서 navigator.credentials.get() 결과를 전송
 */
@Getter
@NoArgsConstructor
public class WebAuthnAuthenticationRequest {

    /**
     * Credential ID (Base64URL encoded)
     */
    private String credentialId;

    /**
     * Authenticator Data (Base64URL encoded)
     */
    private String authenticatorData;

    /**
     * Client Data JSON (Base64URL encoded)
     */
    private String clientDataJSON;

    /**
     * Signature (Base64URL encoded)
     */
    private String signature;

    /**
     * User Handle (Base64URL encoded, optional)
     */
    private String userHandle;
}
