package com.example.openrunapi.domain.club.model.dto;

import lombok.Getter;

/**
 * 회칙 읽음 처리 요청
 * - upToRuleId: 이 id 이하 회칙을 모두 읽음 처리 (null이면 "최신 회칙까지"로 간주)
 */
@Getter
public class MarkClubRulesReadRequest {
    private Long upToRuleId;
}
