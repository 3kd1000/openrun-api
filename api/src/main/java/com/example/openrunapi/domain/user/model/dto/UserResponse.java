package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponse {
    private final Long id;
    private final String email;
    private final String name;
    private final String imageUrl;
    private final LocalDateTime createdAt;
    private final String lastLoginProvider;
    private final LocalDateTime lastLoginAt;

    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.imageUrl = user.getImageUrl();
        this.createdAt = user.getCreatedAt();
        this.lastLoginProvider = user.getLastLoginProvider();
        this.lastLoginAt = user.getLastLoginAt();
    }
}
