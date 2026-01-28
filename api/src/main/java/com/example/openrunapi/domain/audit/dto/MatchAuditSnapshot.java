package com.example.openrunapi.domain.audit.dto;

import com.example.openrunapi.domain.match.model.Match;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Match 엔티티의 Audit용 스냅샷 DTO
 */
@Getter
@Builder
public class MatchAuditSnapshot {
    private Long id;
    private Long clubId;
    private Long scheduleId;
    private Long drawId;
    private Integer matchNumber;
    private Long teamAPlayer1Id;
    private Long teamAPlayer2Id;
    private Long teamBPlayer1Id;
    private Long teamBPlayer2Id;
    private Integer teamAScore;
    private Integer teamBScore;
    private String result;
    private LocalDateTime playedAt;

    public static MatchAuditSnapshot from(Match match) {
        if (match == null) {
            return null;
        }
        return MatchAuditSnapshot.builder()
                .id(match.getId())
                .clubId(match.getClubId())
                .scheduleId(match.getScheduleId())
                .drawId(match.getDrawId())
                .matchNumber(match.getMatchNumber())
                .teamAPlayer1Id(match.getTeamAPlayer1Id())
                .teamAPlayer2Id(match.getTeamAPlayer2Id())
                .teamBPlayer1Id(match.getTeamBPlayer1Id())
                .teamBPlayer2Id(match.getTeamBPlayer2Id())
                .teamAScore(match.getTeamAScore())
                .teamBScore(match.getTeamBScore())
                .result(match.getResult() != null ? match.getResult().name() : null)
                .playedAt(match.getPlayedAt())
                .build();
    }
}
