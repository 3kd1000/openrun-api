package com.example.openrunapi.domain.notification.controller;

import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.model.dto.NotificationResponse;
import com.example.openrunapi.domain.notification.model.dto.SendNotificationRequest;
import com.example.openrunapi.domain.notification.model.dto.UnreadCountResponse;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    /**
     * Get all notifications for current user
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<NotificationResponse> notifications = notificationService.getNotifications(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Mark a notification as read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Mark all notifications as read
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    /**
     * Send notification to one or more users
     */
    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(
            @Valid @RequestBody SendNotificationRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // 인증된 사용자만 호출 가능
        userService.getCurrentUser(userDetails.getUsername());

        NotificationType type;
        try {
            type = NotificationType.valueOf(request.getType() != null ? request.getType() : "SYSTEM");
        } catch (IllegalArgumentException e) {
            type = NotificationType.SYSTEM;
        }

        notificationService.sendNotification(
                request.getClubId(),
                request.getUserIds(),
                request.getTitle(),
                request.getBody(),
                type,
                request.getReferenceId(),
                request.getReferenceType()
        );

        return ResponseEntity.ok().build();
    }
}
