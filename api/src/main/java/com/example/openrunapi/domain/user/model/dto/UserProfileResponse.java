package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.UserProfile;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UserProfileResponse {
    private final LocalDate tennisStartedAt;
    private final String ntrp;
    private final String tournamentHistory;
    private final boolean formerPlayer;

    public UserProfileResponse(UserProfile profile) {
        this.tennisStartedAt = profile.getTennisStartedAt();
        this.ntrp = profile.getNtrp();
        this.tournamentHistory = profile.getTournamentHistory();
        this.formerPlayer = profile.isFormerPlayer();
    }
}

