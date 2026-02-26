package com.example.openrunapi.domain.notification.model.dto;

import com.example.openrunapi.domain.notification.model.Notification;
import com.example.openrunapi.domain.notification.model.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long clubId;
    private String title;
    private String body;
    private NotificationType type;
    private Long referenceId;
    private String referenceType;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getClubId(),
                notification.getTitle(),
                notification.getBody(),
                notification.getType(),
                notification.getReferenceId(),
                notification.getReferenceType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
