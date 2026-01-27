package com.example.openrunapi.domain.club.model.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@NoArgsConstructor
public class ReorderClubRulesRequest {

    @NotEmpty(message = "순서 정보는 필수입니다")
    private Map<Long, Integer> orders; // ruleId -> newOrder
}
