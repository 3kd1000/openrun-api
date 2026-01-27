package com.example.openrunapi.domain.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 내 최근 전적 응답 DTO
 * - 내 관점에서의 경기 결과 (상대팀, 내 점수/상대 점수, 결과)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyRecentMatchResponse {

    private Long matchId;
    private Long scheduleId;
    private LocalDateTime playedAt;

    // 내 팀 정보
    private String myPartnerName;  // 복식 파트너 이름 (null이면 단식)

    // 상대팀 정보
    private String opponent1Name;
    private String opponent2Name;  // 복식 상대 (null이면 단식)

    // 점수
    private Integer myTeamScore;
    private Integer opponentTeamScore;

    // 결과 (WIN, LOSE, DRAW)
    private String result;
}
