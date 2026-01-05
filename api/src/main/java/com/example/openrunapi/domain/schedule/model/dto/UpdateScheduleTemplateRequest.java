package com.example.openrunapi.domain.schedule.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "템플릿 이름은 필수입니다.")
    @Size(max = 5, message = "템플릿 이름은 5자를 초과할 수 없습니다.")
    private String templateName;

    // SCHEDULE 타입일 때 필수 (Service에서 검증)
    @Size(max = 100, message = "코트명은 100자를 초과할 수 없습니다.")
    private String courtName;

    // SCHEDULE 타입일 때 필수 (Service에서 검증)
    @Min(value = 1, message = "최대 정원은 1명 이상이어야 합니다.")
    private Integer maxCapacity;

    private BigDecimal cost;

    // PARTICIPATION_START 타입일 때 필수 (Service에서 검증)
    @Pattern(regexp = "^매달 ([1-9]|[12][0-9]|3[01])일 ([01][0-9]|2[0-3]):([0-5][0-9])$",
             message = "참가신청 시작시간 패턴 형식이 올바르지 않습니다. (예: 매달 1일 00:00)")
    private String participationStartPattern;
}
