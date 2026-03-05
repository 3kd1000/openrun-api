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
@Table(name = "calendar_connection",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "provider"},
                name = "uk_calendar_connection_user_provider"
        ))
public class CalendarConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private CalendarProvider provider;

    @Column(name = "external_email", length = 255)
    private String externalEmail;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "external_calendar_id", length = 255)
    private String externalCalendarId;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public CalendarConnection(Long userId, CalendarProvider provider, String externalEmail,
                              String accessToken, String refreshToken, LocalDateTime tokenExpiresAt,
                              String externalCalendarId) {
        this.userId = userId;
        this.provider = provider;
        this.externalEmail = externalEmail;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = tokenExpiresAt;
        this.externalCalendarId = externalCalendarId;
        this.active = true;
    }

    public void updateTokens(String accessToken, String refreshToken, LocalDateTime tokenExpiresAt) {
        this.accessToken = accessToken;
        if (refreshToken != null) {
            this.refreshToken = refreshToken;
        }
        this.tokenExpiresAt = tokenExpiresAt;
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = null;
    }

    public void setExternalCalendarId(String externalCalendarId) {
        this.externalCalendarId = externalCalendarId;
    }

    public void setExternalEmail(String externalEmail) {
        this.externalEmail = externalEmail;
    }

    public String getCalendarIdOrPrimary() {
        return this.externalCalendarId != null ? this.externalCalendarId : "primary";
    }

    public boolean isTokenExpired() {
        return this.tokenExpiresAt != null && this.tokenExpiresAt.isBefore(LocalDateTime.now());
    }
}
