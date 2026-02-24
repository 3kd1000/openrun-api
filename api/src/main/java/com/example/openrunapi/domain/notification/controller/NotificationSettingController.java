package com.example.openrunapi.domain.notification.controller;

import com.example.openrunapi.domain.notification.model.dto.NotificationSettingResponse;
import com.example.openrunapi.domain.notification.model.dto.NotificationSettingUpdateRequest;
import com.example.openrunapi.domain.notification.service.UserNotificationSettingService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
public class NotificationSettingController {

    private final UserNotificationSettingService settingService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<NotificationSettingResponse> getSettings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(settingService.getSettings(currentUser.getId()));
    }

    @PutMapping
    public ResponseEntity<NotificationSettingResponse> updateSettings(
            @RequestBody NotificationSettingUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(settingService.updateSettings(currentUser.getId(), request));
    }
}
