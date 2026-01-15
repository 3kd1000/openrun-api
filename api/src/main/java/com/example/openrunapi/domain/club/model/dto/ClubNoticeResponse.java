package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubNotice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ClubNoticeResponse {

    private final Long id;
    private final Long clubId;
    private final String title;
    private final String content;
    private final Integer displayOrder;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ClubNoticeResponse(ClubNotice notice) {
        this.id = notice.getId();
        this.clubId = notice.getClub().getId();
        this.title = notice.getTitle();
        this.content = notice.getContent();
        this.displayOrder = notice.getDisplayOrder();
        this.createdAt = notice.getCreatedAt();
        this.updatedAt = notice.getUpdatedAt();
    }
}

