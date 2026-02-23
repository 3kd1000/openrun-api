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

    @Column(name = "user_id")
    private Long userId;

    /**
     * 외부 승인 게스트(또는 외부요청 기반 참가자) 여부
     * - true면 스케줄 참가자 목록 UI에서 '게스트'로 표시 가능
     * - 랭킹/스코어보드 집계에서 제외하는 용도로도 활용 가능
     */
    @Column(name = "guest_name", length = 50)
    private String guestName;

    @Column(name = "as_guest", nullable = false)
    private boolean asGuest = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ParticipantStatus status;

    @Column(name = "position", nullable = false)
    private Integer position;

    @CreatedDate
    @Column(name = "joined_at", updatable = false, nullable = false)
    private LocalDateTime joinedAt;

    @Builder
    public ScheduleParticipant(Long scheduleId, Long userId, String guestName, ParticipantStatus status, Integer position, Boolean asGuest) {
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.guestName = guestName;
        this.status = status;
        this.position = position;
        this.asGuest = Boolean.TRUE.equals(asGuest);
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

    public void pending() {
        this.status = ParticipantStatus.PENDING;
    }

    public void reject() {
        this.status = ParticipantStatus.REJECTED;
    }

    public boolean isPending() {
        return this.status == ParticipantStatus.PENDING;
    }

    public boolean isRejected() {
        return this.status == ParticipantStatus.REJECTED;
    }

    public boolean isGuest() {
        return this.userId == null && this.guestName != null;
    }

    public void updateGuestName(String guestName) {
        if (this.userId == null) {
            this.guestName = guestName;
        }
    }

    public enum ParticipantStatus {
        CONFIRMED,  // 확정
        WAITING,    // 대기
        CANCELLED,  // 취소
        PENDING,    // 승인 대기 (공개일정 전용)
        REJECTED    // 거절됨 (공개일정 전용)
    }
}
