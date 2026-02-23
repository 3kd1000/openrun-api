package com.example.openrunapi.domain.notification.service;

import com.example.openrunapi.domain.notification.model.Notification;
import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.model.dto.NotificationResponse;
import com.example.openrunapi.domain.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FcmSenderService fcmSenderService;

    /**
     * Send notification to multiple users (batch)
     */
    @Transactional
    public void sendNotification(Long clubId, List<Long> userIds, String title, String body, NotificationType type, Long referenceId, String referenceType) {
        Map<String, String> data = new HashMap<>();
        data.put("type", type.name());
        if (referenceId != null) {
            data.put("referenceId", referenceId.toString());
        }
        if (referenceType != null) {
            data.put("referenceType", referenceType);
        }

        for (Long userId : userIds) {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .clubId(clubId)
                    .title(title)
                    .body(body)
                    .type(type)
                    .referenceId(referenceId)
                    .referenceType(referenceType)
                    .build();

            notificationRepository.save(notification);
            try {
                fcmSenderService.sendToUser(userId, title, body, data);
            } catch (Exception e) {
                log.warn("Failed to send FCM to user {}: {}", userId, e.getMessage());
            }
        }

        log.info("Sent notification to {} users (clubId={}): {}", userIds.size(), clubId, title);
    }

    /**
     * Send notification to a single user (convenience method for Phase 2 triggers)
     */
    @Transactional
    public void sendNotification(Long clubId, Long userId, String title, String body, NotificationType type, Long referenceId, String referenceType) {
        sendNotification(clubId, List.of(userId), title, body, type, referenceId, referenceType);
    }

    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to user: " + userId);
        }

        notification.markAsRead();
        log.info("Marked notification {} as read for user {}", notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        log.info("Marked all notifications as read for user {}", userId);
    }

    public long getUnreadCount(Long userId) {
        // MESSAGE 타입은 메시지함 아이콘에서 별도로 표시하므로 벨 배지에서 제외
        return notificationRepository.countByUserIdAndIsReadFalseAndTypeNot(userId, NotificationType.MESSAGE);
    }

    @Transactional
    public int deleteNotifications(List<Long> ids, Long userId) {
        int deleted = notificationRepository.deleteByUserIdAndIdIn(userId, ids);
        log.info("Deleted {} notifications for user {}", deleted, userId);
        return deleted;
    }

    @Transactional
    public int deleteReadNotifications(Long userId) {
        int deleted = notificationRepository.deleteReadByUserId(userId);
        log.info("Deleted {} read notifications for user {}", deleted, userId);
        return deleted;
    }

    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteAllByUserId(userId);
        log.info("Deleted all notifications for user {}", userId);
    }
}
