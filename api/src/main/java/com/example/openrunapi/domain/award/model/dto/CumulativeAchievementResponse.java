package com.example.openrunapi.domain.award.model.dto;

import com.example.openrunapi.domain.club.model.AwardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * 클럽 내 전체 멤버의 누적 업적 응답
 */
@Getter
@Builder
@AllArgsConstructor
public class CumulativeAchievementResponse {

    /**
     * 멤버별 누적 업적 목록
     */
    private List<MemberAchievement> members;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class MemberAchievement {
        private Long userId;
        private String userName;
        /**
         * 어워드 타입별 수상 횟수
         * key: ATTENDANCE, POINTS, BOOKING
         * value: 수상 횟수
         */
        private Map<AwardType, Integer> awardCounts;

        /**
         * 대표 업적 (가장 높은 티어의 업적)
         */
        private AwardType primaryAward;

        /**
         * 대표 업적의 티어 (1~5)
         */
        private int primaryTier;
    }
}
