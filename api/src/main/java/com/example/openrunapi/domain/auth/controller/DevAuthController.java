package com.example.openrunapi.domain.auth.controller;

import com.example.openrunapi.domain.auth.service.DevAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevAuthController {

    private final DevAuthService devAuthService;

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody DevLoginRequest request) {
        User user = devAuthService.login(request.getEmail(), request.getName());
        return ResponseEntity.ok(new UserResponse(user));
    }

    @Data
    public static class DevLoginRequest {
        private String email;
        private String name;
    }
}
