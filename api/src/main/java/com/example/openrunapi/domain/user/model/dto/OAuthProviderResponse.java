package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.UserOAuthProvider;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class OAuthProviderResponse {
    private final Long id;
    private final String provider;
    private final LocalDateTime createdAt;

    public OAuthProviderResponse(UserOAuthProvider oauthProvider) {
        this.id = oauthProvider.getId();
        this.provider = oauthProvider.getProvider().name();
        this.createdAt = oauthProvider.getCreatedAt();
    }
}
