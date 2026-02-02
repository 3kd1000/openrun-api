package com.example.openrunapi.domain.draw.model.dto;

import java.util.List;

import com.example.openrunapi.domain.draw.model.DrawType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateDrawRequestWithIds {
    private List<Long> userIds;

    private List<Long> seedUserIds; // Seeded 인 경우 시드 플레이어 ID 리스트

    private DrawType drawType; // Single, Double, Seeded 여부

    private List<Long> groupAUserIds; // Double 인 경우 그룹 A 플레이어 ID 리스트

    private List<Long> groupBUserIds; // Double 인 경우 그룹 B 플레이어 ID 리스트

    private Integer numberOfTotalPlayer; // 총 플레이어 수

    private List<ManualGame> manualGames; // MANUAL 타입인 경우 수동 대진 정보

    /**
     * 수동 대진 게임 정보
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualGame {
        private Integer gameNo;
        private Integer roundNo;
        private List<Long> teamAUserIds;  // Team A 선수 ID [player1, player2]
        private List<Long> teamBUserIds;  // Team B 선수 ID [player1, player2]
    }
}

