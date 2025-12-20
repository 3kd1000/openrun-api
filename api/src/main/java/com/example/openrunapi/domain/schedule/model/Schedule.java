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
@Table(name = "schedule")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "club_id", nullable = false)
    private Long clubId;

    @Column(name = "court_name", length = 100, nullable = false)
    private String courtName;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    @Column(name = "current_participants", nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "cost", precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Schedule(Long clubId, String courtName, LocalDateTime scheduledAt,
                    Integer maxCapacity, BigDecimal cost, String description) {
        this.clubId = clubId;
        this.courtName = courtName;
        this.scheduledAt = scheduledAt;
        this.maxCapacity = maxCapacity;
        this.cost = cost;
        this.description = description;
    }

    public void update(String courtName, LocalDateTime scheduledAt,
                       Integer maxCapacity, BigDecimal cost, String description) {
        this.courtName = courtName;
        this.scheduledAt = scheduledAt;
        this.maxCapacity = maxCapacity;
        this.cost = cost;
        this.description = description;
    }

    public void incrementParticipants() {
        this.currentParticipants++;
    }

    public void decrementParticipants() {
        if (this.currentParticipants > 0) {
            this.currentParticipants--;
        }
    }

    public boolean isFull() {
        return this.currentParticipants >= this.maxCapacity;
    }

    public boolean hasAvailableSlot() {
        return this.currentParticipants < this.maxCapacity;
    }
}
