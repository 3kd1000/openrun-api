package com.example.openrunapi.domain.draw.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrawResponse {

    private List<Game> games;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Game {
        private int gameNo;
        private int roundNo;
        private List<String> teamA;
        private List<String> teamB;
        private Long matchId;  // 경기 결과 입력을 위한 Match ID

        // 경기 결과 정보
        private Integer teamAScore;
        private Integer teamBScore;
        private String result;  // "TEAM_A_WIN", "TEAM_B_WIN", "DRAW"
        private String playedAt;  // ISO 8601 format
    }
}
