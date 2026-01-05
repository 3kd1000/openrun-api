package com.example.openrunapi.domain.schedule.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "schedule_template",
        uniqueConstraints = @UniqueConstraint(
                name = "idx_schedule_template_user_type_name",
                columnNames = {"user_id", "template_type", "template_name"}
        ),
        indexes = {
                @Index(name = "idx_schedule_template_user_id", columnList = "user_id")
        }
)
public class ScheduleTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", length = 30, nullable = false)
    private TemplateType templateType;

    @Column(name = "template_name", length = 5, nullable = false)
    private String templateName;

    @Column(name = "court_name", length = 100)
    private String courtName;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "cost", precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "participation_start_pattern", length = 50)
    private String participationStartPattern;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public ScheduleTemplate(Long userId, TemplateType templateType, String templateName,
                            String courtName, Integer maxCapacity, BigDecimal cost,
                            String participationStartPattern) {
        this.userId = userId;
        this.templateType = templateType;
        this.templateName = templateName;
        this.courtName = courtName;
        this.maxCapacity = maxCapacity;
        this.cost = cost;
        this.participationStartPattern = participationStartPattern;
    }

    /**
     * 템플릿 업데이트
     * templateType은 변경되지 않음
     */
    public void update(String templateName, String courtName, Integer maxCapacity,
                       BigDecimal cost, String participationStartPattern) {
        this.templateName = templateName;
        // templateType에 따라 관련 필드만 업데이트
        if (this.templateType == TemplateType.SCHEDULE) {
            this.courtName = courtName;
            this.maxCapacity = maxCapacity;
            this.cost = cost;
        } else if (this.templateType == TemplateType.PARTICIPATION_START) {
            this.participationStartPattern = participationStartPattern;
        }
    }
}
