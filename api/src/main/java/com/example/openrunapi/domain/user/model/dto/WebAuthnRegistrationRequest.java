package com.example.openrunapi.domain.user.model.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * WebAuthn 등록 요청 DTO
 * 프론트엔드에서 navigator.credentials.create() 결과를 전송
 */
@Getter
@NoArgsConstructor
public class WebAuthnRegistrationRequest {

    /**
     * Credential ID (Base64URL encoded)
     */
    private String credentialId;

    /**
     * Public Key (Base64URL encoded)
     */
    private String publicKey;

    /**
     * Attestation Object (Base64URL encoded)
     */
    private String attestationObject;

    /**
     * Client Data JSON (Base64URL encoded)
     */
    private String clientDataJSON;

    /**
     * Transports (e.g., ["internal", "hybrid"])
     */
    private String[] transports;

    /**
     * 사용자가 지정한 기기 이름
     */
    private String deviceName;
}
