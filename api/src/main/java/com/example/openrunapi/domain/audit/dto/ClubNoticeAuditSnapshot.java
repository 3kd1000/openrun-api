package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.club.model.ClubNotice;
import lombok.Builder;
import lombok.Getter;

/**
 * ClubNotice Audit 스냅샷
 */
@Getter
@Builder
public class ClubNoticeAuditSnapshot {
    private final Long id;
    private final Long clubId;
    private final String title;
    private final String content;
    private final Integer displayOrder;

    public static ClubNoticeAuditSnapshot from(ClubNotice notice) {
        return ClubNoticeAuditSnapshot.builder()
                .id(notice.getId())
                .clubId(notice.getClub().getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .displayOrder(notice.getDisplayOrder())
                .build();
    }
}
