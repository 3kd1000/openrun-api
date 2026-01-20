package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.UserProfile;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UpdateUserProfileRequest {
    private LocalDate tennisStartedAt;
    private String ntrp;
    private String tournamentHistory;
    private Boolean formerPlayer;
}

