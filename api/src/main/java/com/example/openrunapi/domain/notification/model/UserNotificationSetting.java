package com.example.openrunapi.domain.notification.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
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
@Table(name = "user_notification_setting")
public class UserNotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "noti_schedule", nullable = false)
    private boolean notiSchedule = true;

    @Column(name = "noti_club", nullable = false)
    private boolean notiClub = true;

    @Column(name = "noti_message", nullable = false)
    private boolean notiMessage = true;

    @Column(name = "noti_system", nullable = false)
    private boolean notiSystem = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UserNotificationSetting(Long userId) {
        this.userId = userId;
    }

    public void update(boolean notiSchedule, boolean notiClub, boolean notiMessage, boolean notiSystem) {
        this.notiSchedule = notiSchedule;
        this.notiClub = notiClub;
        this.notiMessage = notiMessage;
        this.notiSystem = notiSystem;
    }

    public boolean isEnabled(NotificationType type) {
        return switch (type) {
            case SCHEDULE, DRAW -> notiSchedule;
            case CLUB_INVITE, EXTERNAL_REQUEST, REQUEST_RESULT -> notiClub;
            case MESSAGE -> notiMessage;
            case SYSTEM -> notiSystem;
        };
    }
}
