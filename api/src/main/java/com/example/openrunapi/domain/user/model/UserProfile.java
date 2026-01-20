package com.example.openrunapi.domain.user.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "user_profile")
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "tennis_started_at")
    private LocalDate tennisStartedAt;

    @Column(name = "ntrp", length = 20)
    // 숫자로 강제하지 않고 문자열로 저장 (예: 3.0, 3.5, "Self-rated 4.0" 등)
    private String ntrp;

    @Column(name = "tournament_history", columnDefinition = "TEXT")
    private String tournamentHistory;

    @Column(name = "former_player", nullable = false)
    private boolean formerPlayer = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserProfile(User user) {
        this.user = user;
    }

    public void update(
            LocalDate tennisStartedAt,
            String ntrp,
            String tournamentHistory,
            Boolean formerPlayer
    ) {
        this.tennisStartedAt = tennisStartedAt;
        this.ntrp = ntrp;
        this.tournamentHistory = tournamentHistory;
        if (formerPlayer != null) this.formerPlayer = formerPlayer;
    }
}

