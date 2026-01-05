package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.ScheduleTemplate;
import com.example.openrunapi.domain.schedule.model.TemplateType;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class ScheduleTemplateResponse {

    private final Long id;
    private final Long userId;
    private final TemplateType templateType;
    private final String templateName;
    private final String courtName;
    private final Integer maxCapacity;
    private final BigDecimal cost;
    private final String participationStartPattern;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ScheduleTemplateResponse(ScheduleTemplate template) {
        this.id = template.getId();
        this.userId = template.getUserId();
        this.templateType = template.getTemplateType();
        this.templateName = template.getTemplateName();
        this.courtName = template.getCourtName();
        this.maxCapacity = template.getMaxCapacity();
        this.cost = template.getCost();
        this.participationStartPattern = template.getParticipationStartPattern();
        this.createdAt = template.getCreatedAt();
        this.updatedAt = template.getUpdatedAt();
    }
}
