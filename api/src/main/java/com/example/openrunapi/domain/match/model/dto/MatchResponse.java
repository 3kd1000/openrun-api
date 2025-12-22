package com.example.openrunapi.domain.match.model.dto;

import com.example.openrunapi.domain.match.model.Match;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private Long clubId;
    private Long scheduleId;
    private Long drawId;
    private Integer matchNumber;

    // Team A
    private Long teamAPlayer1Id;
    private String teamAPlayer1Name;
    private Long teamAPlayer2Id;
    private String teamAPlayer2Name;

    // Team B
    private Long teamBPlayer1Id;
    private String teamBPlayer1Name;
    private Long teamBPlayer2Id;
    private String teamBPlayer2Name;

    // 경기 결과
    private Integer teamAScore;
    private Integer teamBScore;
    private String result;

    private LocalDateTime playedAt;
    private Boolean isMigrated;

    public static MatchResponse from(Match match,
                                      String teamAPlayer1Name,
                                      String teamAPlayer2Name,
                                      String teamBPlayer1Name,
                                      String teamBPlayer2Name) {
        return MatchResponse.builder()
                .id(match.getId())
                .clubId(match.getClubId())
                .scheduleId(match.getScheduleId())
                .drawId(match.getDrawId())
                .matchNumber(match.getMatchNumber())
                .teamAPlayer1Id(match.getTeamAPlayer1Id())
                .teamAPlayer1Name(teamAPlayer1Name)
                .teamAPlayer2Id(match.getTeamAPlayer2Id())
                .teamAPlayer2Name(teamAPlayer2Name)
                .teamBPlayer1Id(match.getTeamBPlayer1Id())
                .teamBPlayer1Name(teamBPlayer1Name)
                .teamBPlayer2Id(match.getTeamBPlayer2Id())
                .teamBPlayer2Name(teamBPlayer2Name)
                .teamAScore(match.getTeamAScore())
                .teamBScore(match.getTeamBScore())
                .result(match.getResult() != null ? match.getResult().name() : null)
                .playedAt(match.getPlayedAt())
                .isMigrated(match.getIsMigrated())
                .build();
    }
}
