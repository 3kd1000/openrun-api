package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.MatchType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScheduleTemplateRequest {

    @NotBlank(message = "즐겨찾기 이름은 필수입니다.")
    @Size(max = 20, message = "즐겨찾기 이름은 20자를 초과할 수 없습니다.")
    private String templateName;

    // SCHEDULE 타입일 때 필수 (Service에서 검증)
    @Size(max = 100, message = "코트명은 100자를 초과할 수 없습니다.")
    private String courtName;

    // SCHEDULE 타입일 때 필수 (Service에서 검증)
    @Min(value = 1, message = "최대 정원은 1명 이상이어야 합니다.")
    private Integer maxCapacity;

    private BigDecimal cost;

    @Size(max = 200, message = "코트 주소는 200자를 초과할 수 없습니다.")
    private String courtAddress;

    @Size(max = 50, message = "지역은 50자를 초과할 수 없습니다.")
    private String region;

    private MatchType matchType;

    @Min(value = 1, message = "코트 수는 1면 이상이어야 합니다.")
    private Integer numberOfCourts;

    // PARTICIPATION_START 타입일 때 필수 (Service에서 검증)
    @Pattern(regexp = "^매달 ([1-9]|[12][0-9]|3[01])일 ([01][0-9]|2[0-3]):([0-5][0-9])$",
             message = "참가신청 시작시간 패턴 형식이 올바르지 않습니다. (예: 매달 1일 00:00)")
    private String participationStartPattern;
}
