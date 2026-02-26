package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.MatchType;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduleRequest {

    private Long clubId;

    @NotBlank(message = "코트명은 필수입니다.")
    @Size(max = 100, message = "코트명은 100자를 초과할 수 없습니다.")
    private String courtName;

    @NotNull(message = "일정 시간은 필수입니다.")
    private LocalDateTime scheduledAt;

    @NotNull(message = "최대 정원은 필수입니다.")
    @Min(value = 1, message = "최대 정원은 1명 이상이어야 합니다.")
    private Integer maxCapacity;

    private BigDecimal cost;

    @Size(max = 5000, message = "설명은 5000자를 초과할 수 없습니다.")
    private String description;

    private Long reservedByUserId;

    private LocalDateTime participationStartAt;

    private MatchType matchType;

    @Min(value = 30, message = "기간은 최소 30분 이상이어야 합니다.")
    private Integer durationMinutes;

    @Min(value = 1, message = "코트 수는 1 이상이어야 합니다.")
    private Integer numberOfCourts;

    @Size(max = 200, message = "코트 주소는 200자를 초과할 수 없습니다.")
    private String courtAddress;

    @Size(max = 50, message = "지역은 50자를 초과할 수 없습니다.")
    private String region;

    /**
     * Schedule 엔티티로 변환하는 메소드
     */
    public Schedule toEntity() {
        ScheduleType type = (this.clubId != null) ? ScheduleType.CLUB : ScheduleType.PUBLIC;
        return Schedule.builder()
                .clubId(this.clubId)
                .courtName(this.courtName)
                .scheduledAt(this.scheduledAt)
                .maxCapacity(this.maxCapacity)
                .cost(this.cost)
                .description(this.description)
                .reservedByUserId(this.reservedByUserId)
                .participationStartAt(this.participationStartAt)
                .matchType(this.matchType)
                .durationMinutes(this.durationMinutes)
                .numberOfCourts(this.numberOfCourts)
                .courtAddress(this.courtAddress)
                .region(this.region)
                .scheduleType(type)
                .build();
    }
}
