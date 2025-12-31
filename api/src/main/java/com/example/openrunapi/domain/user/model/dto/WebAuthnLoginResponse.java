package com.example.openrunapi.domain.user.model.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * WebAuthn 로그인 성공 응답 DTO
 * Firebase Custom Token 포함
 */
@Getter
@Builder
public class WebAuthnLoginResponse {

    /**
     * Firebase Custom Token
     * 프론트엔드에서 signInWithCustomToken()에 사용
     */
    private String customToken;

    /**
     * 사용자 ID
     */
    private Long userId;

    /**
     * 사용자 이름
     */
    private String userName;

    /**
     * 사용자 이메일
     */
    private String email;
}
