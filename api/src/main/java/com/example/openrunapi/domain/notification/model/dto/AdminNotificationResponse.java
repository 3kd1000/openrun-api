package com.example.openrunapi.domain.notification.model.dto;

import com.example.openrunapi.domain.notification.model.Notification;
import com.example.openrunapi.domain.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminNotificationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long clubId;
    private String clubName;
    private String title;
    private String body;
    private NotificationType type;
    private Long referenceId;
    private String referenceType;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static AdminNotificationResponse from(Notification notification, String userName, String clubName) {
        return new AdminNotificationResponse(
                notification.getId(),
                notification.getUserId(),
                userName,
                notification.getClubId(),
                clubName,
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
