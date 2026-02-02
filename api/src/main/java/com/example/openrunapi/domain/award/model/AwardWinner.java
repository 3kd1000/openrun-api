package com.example.openrunapi.domain.award.model;

import com.example.openrunapi.domain.club.model.AwardType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "award_winner")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AwardWinner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "club_id", nullable = false)
    private Long clubId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "award_type", nullable = false, length = 20)
    private AwardType awardType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "value")
    private Long value;

    @Column(name = "is_manual", nullable = false)
    @Builder.Default
    private Boolean isManual = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by")
    private Long createdBy;
}
