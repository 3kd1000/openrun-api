package com.example.openrunapi.domain.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 개인 전체 경기 기록 응답 DTO
 * - 클럽명을 포함하여 모든 클럽의 경기를 조회
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyAllMatchResponse {

    private Long matchId;
    private Long clubId;
    private String clubName;
    private Long scheduleId;
    private LocalDateTime playedAt;

    // Team A
    private String teamAPlayer1Name;
    private String teamAPlayer2Name;
    private Integer teamAScore;

    // Team B
    private String teamBPlayer1Name;
    private String teamBPlayer2Name;
    private Integer teamBScore;

    // 결과
    private String result;
}
