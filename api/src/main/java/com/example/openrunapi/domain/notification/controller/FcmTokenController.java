package com.example.openrunapi.domain.notification.controller;

import com.example.openrunapi.domain.notification.model.dto.RegisterTokenRequest;
import com.example.openrunapi.domain.notification.model.dto.RemoveTokenRequest;
import com.example.openrunapi.domain.notification.service.FcmTokenService;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fcm/tokens")
@RequiredArgsConstructor
public class FcmTokenController {

    private final FcmTokenService fcmTokenService;
    private final UserService userService;

    /**
     * Register FCM device token
     */
    @PostMapping
    public ResponseEntity<Void> registerToken(
            @Valid @RequestBody RegisterTokenRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        fcmTokenService.registerToken(currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }

    /**
     * Remove FCM device token
     */
    @DeleteMapping
    public ResponseEntity<Void> removeToken(
            @Valid @RequestBody RemoveTokenRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        fcmTokenService.removeToken(currentUser.getId(), request.getToken());
        return ResponseEntity.ok().build();
    }
}
