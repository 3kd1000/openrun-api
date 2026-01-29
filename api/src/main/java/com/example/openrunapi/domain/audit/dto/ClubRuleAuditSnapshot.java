package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.club.model.ClubRule;
import lombok.Builder;
import lombok.Getter;

/**
 * ClubRule Audit 스냅샷
 */
@Getter
@Builder
public class ClubRuleAuditSnapshot {
    private final Long id;
    private final Long clubId;
    private final String title;
    private final String content;
    private final Integer displayOrder;

    public static ClubRuleAuditSnapshot from(ClubRule rule) {
        return ClubRuleAuditSnapshot.builder()
                .id(rule.getId())
                .clubId(rule.getClub().getId())
                .title(rule.getTitle())
                .content(rule.getContent())
                .displayOrder(rule.getDisplayOrder())
                .build();
    }
}
