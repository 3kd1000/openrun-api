package com.example.openrunapi.domain.notification.controller;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.notification.model.Notification;
import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.model.dto.AdminNotificationResponse;
import com.example.openrunapi.domain.notification.model.dto.SendNotificationRequest;
import com.example.openrunapi.domain.notification.repository.NotificationRepository;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;

    /**
     * 알림 발송 이력 조회 (페이징 + 클럽/타입 필터)
     */
    @GetMapping
    public ResponseEntity<Page<AdminNotificationResponse>> getNotificationHistory(
            @RequestParam(required = false) Long clubId,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<Notification> notifications = findNotifications(clubId, type, pageable);

        Set<Long> userIds = notifications.getContent().stream()
                .map(Notification::getUserId)
                .collect(Collectors.toSet());
        Set<Long> clubIds = notifications.getContent().stream()
                .map(Notification::getClubId)
                .collect(Collectors.toSet());

        Map<Long, String> userNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        Map<Long, String> clubNameMap = clubRepository.findAllById(clubIds).stream()
                .collect(Collectors.toMap(Club::getId, Club::getName));

        Page<AdminNotificationResponse> response = notifications.map(n ->
                AdminNotificationResponse.from(n,
                        userNameMap.getOrDefault(n.getUserId(), "Unknown"),
                        clubNameMap.getOrDefault(n.getClubId(), "Unknown")));

        return ResponseEntity.ok(response);
    }

    /**
     * 알림 발송 (Admin에서 직접 발송)
     */
    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(
            @Valid @RequestBody SendNotificationRequest request
    ) {
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

    private Page<Notification> findNotifications(Long clubId, NotificationType type, Pageable pageable) {
        if (clubId != null && type != null) {
            // 타입 명시 요청 - MESSAGE 포함 그대로 조회
            return notificationRepository.findByClubIdAndTypeOrderByCreatedAtDesc(clubId, type, pageable);
        } else if (clubId != null) {
            // 클럽 필터만 - MESSAGE 제외
            return notificationRepository.findByClubIdAndTypeNotOrderByCreatedAtDesc(clubId, NotificationType.MESSAGE, pageable);
        } else if (type != null) {
            // 타입 명시 요청 - MESSAGE 포함 그대로 조회
            return notificationRepository.findByTypeOrderByCreatedAtDesc(type, pageable);
        } else {
            // 전체 조회 - MESSAGE 제외 (DM 대화 노이즈 제거)
            return notificationRepository.findAllByTypeNotOrderByCreatedAtDesc(NotificationType.MESSAGE, pageable);
        }
    }
}
