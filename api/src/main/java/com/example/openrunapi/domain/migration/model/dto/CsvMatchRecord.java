package com.example.openrunapi.domain.migration.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CsvMatchRecord {

    // 경기 날짜 및 장소
    private LocalDate date;           // 20250906 → 2025-09-06
    private String location;          // "편편"

    // Team A
    private String teamAPlayer1;      // "송현우"
    private String teamAPlayer2;      // "마동혁"
    private String teamAResult;       // "승" or "무" or "패"
    private Integer teamAScore;       // 6

    // Team B
    private Integer teamBScore;       // 2
    private String teamBResult;       // "패" or "무" or "승"
    private String teamBPlayer1;      // "김형준"
    private String teamBPlayer2;      // "송현우"

    /**
     * 승무패 결과를 MatchResult enum으로 변환
     */
    public com.example.openrunapi.domain.match.model.Match.MatchResult getMatchResult() {
        if ("승".equals(teamAResult)) {
            return com.example.openrunapi.domain.match.model.Match.MatchResult.TEAM_A_WIN;
        } else if ("무".equals(teamAResult)) {
            return com.example.openrunapi.domain.match.model.Match.MatchResult.DRAW;
        } else {
            return com.example.openrunapi.domain.match.model.Match.MatchResult.TEAM_B_WIN;
        }
    }
}
