package com.example.openrunapi.domain.award.model.dto;

import com.example.openrunapi.domain.club.model.AwardType;
import com.example.openrunapi.domain.club.model.RankingPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * 현재 어워드 수상자 응답
 * 크라운 배지 표시에 사용
 */
@Getter
@Builder
@AllArgsConstructor
public class AwardWinnersResponse {
    private final RankingPeriod period;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Set<Long> winnerUserIds;  // 모든 어워드 타입의 1등 사용자 ID
    private final List<WinnerDetail> winners;  // 상세 정보

    @Getter
    @Builder
    @AllArgsConstructor
    public static class WinnerDetail {
        private final AwardType type;
        private final Long userId;
        private final String userName;
        private final Long value;
    }
}
