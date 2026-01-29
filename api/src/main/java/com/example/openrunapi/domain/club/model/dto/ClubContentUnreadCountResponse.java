package com.example.openrunapi.domain.club.model.dto;

import lombok.Getter;

/**
 * 공지사항 + 회칙 통합 unread count 응답
 */
@Getter
public class ClubContentUnreadCountResponse {
    private final long noticeUnreadCount;
    private final long ruleUnreadCount;
    private final long totalUnreadCount;

    public ClubContentUnreadCountResponse(long noticeUnreadCount, long ruleUnreadCount) {
        this.noticeUnreadCount = noticeUnreadCount;
        this.ruleUnreadCount = ruleUnreadCount;
        this.totalUnreadCount = noticeUnreadCount + ruleUnreadCount;
    }
}
