package com.example.openrunapi.domain.match.model;

import com.example.openrunapi.domain.match.listener.MatchEntityListener;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "match")
@EntityListeners(MatchEntityListener.class)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "club_id")
    private Long clubId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "draw_id")
    private Long drawId;

    @Column(name = "match_number", nullable = false)
    private Integer matchNumber;

    // Team A
    @Column(name = "team_a_player1_id", nullable = false)
    private Long teamAPlayer1Id;

    @Column(name = "team_a_player2_id")
    private Long teamAPlayer2Id;

    // Team B
    @Column(name = "team_b_player1_id", nullable = false)
    private Long teamBPlayer1Id;

    @Column(name = "team_b_player2_id")
    private Long teamBPlayer2Id;

    // 경기 결과
    @Column(name = "team_a_score")
    private Integer teamAScore;

    @Column(name = "team_b_score")
    private Integer teamBScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private MatchResult result;

    @Column(name = "played_at")
    private LocalDateTime playedAt;

    @Column(name = "is_migrated", nullable = false)
    @Builder.Default
    private Boolean isMigrated = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum MatchResult {
        TEAM_A_WIN,
        TEAM_B_WIN,
        DRAW
    }
}
