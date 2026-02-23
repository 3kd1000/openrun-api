package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.MatchType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePublicScheduleRequest {
    @NotBlank
    private String courtName;
    private String courtAddress;
    private String region;
    @NotNull
    private LocalDateTime scheduledAt;
    @NotNull
    @Min(1)
    private Integer maxCapacity;
    private BigDecimal cost;
    private String description;
    private MatchType matchType;
    private Integer durationMinutes;
    private Integer numberOfCourts;
}
