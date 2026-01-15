package com.example.openrunapi.domain.club.model.dto;

import lombok.Getter;

@Getter
public class ClubNoticeUnreadCountResponse {
    private final long unreadCount;

    public ClubNoticeUnreadCountResponse(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}

