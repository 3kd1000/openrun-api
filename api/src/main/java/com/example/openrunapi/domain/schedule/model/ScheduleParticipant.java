package com.example.openrunapi.domain.schedule.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "schedule_participant")
public class ScheduleParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ParticipantStatus status;

    @Column(name = "position", nullable = false)
    private Integer position;

    @CreatedDate
    @Column(name = "joined_at", updatable = false, nullable = false)
    private LocalDateTime joinedAt;

    @Builder
    public ScheduleParticipant(Long scheduleId, Long userId, ParticipantStatus status, Integer position) {
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.status = status;
        this.position = position;
    }

    public void cancel() {
        this.status = ParticipantStatus.CANCELLED;
    }

    public void confirm() {
        this.status = ParticipantStatus.CONFIRMED;
    }

    public void waitlist() {
        this.status = ParticipantStatus.WAITING;
    }

    public boolean isCancelled() {
        return this.status == ParticipantStatus.CANCELLED;
    }

    public boolean isConfirmed() {
        return this.status == ParticipantStatus.CONFIRMED;
    }

    public boolean isWaiting() {
        return this.status == ParticipantStatus.WAITING;
    }

    public enum ParticipantStatus {
        CONFIRMED,  // 확정
        WAITING,    // 대기
        CANCELLED   // 취소
    }
}
