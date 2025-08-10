package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponse {
    private final Long id;
    private final String uid;
    private final String email;
    private final String nickname;
    private final String imageUrl;
    private final LocalDateTime createdAt;

    public UserResponse(User user) {
        this.id = user.getId();
        this.uid = user.getUid();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.imageUrl = user.getImageUrl();
        this.createdAt = user.getCreatedAt();
    }
}
