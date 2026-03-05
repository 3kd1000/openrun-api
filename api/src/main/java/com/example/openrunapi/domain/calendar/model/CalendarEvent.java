package com.example.openrunapi.domain.calendar.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "calendar_event",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"calendar_connection_id", "schedule_id"},
                name = "uk_calendar_event_connection_schedule"
        ))
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_connection_id", nullable = false)
    private CalendarConnection calendarConnection;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "external_event_id", nullable = false, length = 255)
    private String externalEventId;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public CalendarEvent(CalendarConnection calendarConnection, Long scheduleId,
                         String externalEventId) {
        this.calendarConnection = calendarConnection;
        this.scheduleId = scheduleId;
        this.externalEventId = externalEventId;
        this.lastSyncedAt = LocalDateTime.now();
    }

    public void updateExternalEventId(String externalEventId) {
        this.externalEventId = externalEventId;
        this.lastSyncedAt = LocalDateTime.now();
    }

    public void markSynced() {
        this.lastSyncedAt = LocalDateTime.now();
    }
}
