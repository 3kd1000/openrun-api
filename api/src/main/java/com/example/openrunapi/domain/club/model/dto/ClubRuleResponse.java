package com.example.openrunapi.domain.club.model.dto;

import com.example.openrunapi.domain.club.model.ClubRule;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ClubRuleResponse {

    private final Long id;
    private final Long clubId;
    private final String title;
    private final String content;
    private final Integer displayOrder;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ClubRuleResponse(ClubRule clubRule) {
        this.id = clubRule.getId();
        this.clubId = clubRule.getClub().getId();
        this.title = clubRule.getTitle();
        this.content = clubRule.getContent();
        this.displayOrder = clubRule.getDisplayOrder();
        this.createdAt = clubRule.getCreatedAt();
        this.updatedAt = clubRule.getUpdatedAt();
    }
}
