package com.example.openrunapi.domain.award.model.dto;

import com.example.openrunapi.domain.club.model.AwardType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 어워드 수상자 저장 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SaveAwardWinnerRequest {
    private AwardType awardType;
    private Long userId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long value;  // 기록값 (선택)
}
