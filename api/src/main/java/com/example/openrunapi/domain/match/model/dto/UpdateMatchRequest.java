package com.example.openrunapi.domain.match.model.dto;

import com.example.openrunapi.domain.match.model.Match;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMatchRequest {

    @NotNull(message = "Team A 스코어는 필수입니다")
    @Min(value = 0, message = "스코어는 0 이상이어야 합니다")
    private Integer teamAScore;

    @NotNull(message = "Team B 스코어는 필수입니다")
    @Min(value = 0, message = "스코어는 0 이상이어야 합니다")
    private Integer teamBScore;

    @NotNull(message = "경기 결과는 필수입니다")
    private Match.MatchResult result;

    private LocalDateTime playedAt;
}
