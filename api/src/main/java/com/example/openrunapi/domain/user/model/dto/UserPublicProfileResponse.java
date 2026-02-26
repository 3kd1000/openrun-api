package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserPublicProfileResponse {
    private final Long id;
    private final String displayName;
    private final String region;
    private final Long publicScheduleCount;
    private final LocalDateTime createdAt;

    public static UserPublicProfileResponse from(User user, long publicScheduleCount) {
        return UserPublicProfileResponse.builder()
                .id(user.getId())
                .displayName(user.getPublicDisplayName())
                .region(user.getRegionDisplay())
                .publicScheduleCount(publicScheduleCount)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
