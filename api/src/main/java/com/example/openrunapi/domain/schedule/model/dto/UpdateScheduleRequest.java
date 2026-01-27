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
public class UpdateScheduleRequest {

    @NotBlank(message = "코트명은 필수입니다")
    private String courtName;

    @NotNull(message = "일정 시간은 필수입니다")
    private LocalDateTime scheduledAt;

    @NotNull(message = "최대 정원은 필수입니다")
    @Min(value = 1, message = "최대 정원은 1명 이상이어야 합니다")
    private Integer maxCapacity;

    private BigDecimal cost;

    private String description;

    private Long reservedByUserId;

    private LocalDateTime participationStartAt;

    private MatchType matchType;

    @Min(value = 30, message = "기간은 최소 30분 이상이어야 합니다.")
    private Integer durationMinutes;
}
