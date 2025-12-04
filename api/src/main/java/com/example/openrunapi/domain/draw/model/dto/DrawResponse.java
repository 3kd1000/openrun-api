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
    }
}
