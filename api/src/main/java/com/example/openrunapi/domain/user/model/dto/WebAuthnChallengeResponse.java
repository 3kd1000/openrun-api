package com.example.openrunapi.domain.user.model.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * WebAuthn Challenge 응답 DTO
 * 등록 또는 인증 시작 시 클라이언트에게 전달
 */
@Getter
@Builder
public class WebAuthnChallengeResponse {

    /**
     * Challenge (Base64URL encoded)
     */
    private String challenge;

    /**
     * Relying Party ID (도메인)
     */
    private String rpId;

    /**
     * Relying Party 이름
     */
    private String rpName;

    /**
     * User ID (Base64URL encoded)
     */
    private String userId;

    /**
     * User Name
     */
    private String userName;

    /**
     * User Display Name
     */
    private String userDisplayName;

    /**
     * Timeout (milliseconds)
     */
    private Long timeout;
}
