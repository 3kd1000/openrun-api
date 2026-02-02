package com.example.openrunapi.domain.award.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 어워드 수상자 수정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAwardWinnerRequest {
    private Long userId;
    private Long value;  // 기록값 (선택)
}
