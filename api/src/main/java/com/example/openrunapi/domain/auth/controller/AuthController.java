package com.example.openrunapi.domain.auth.controller;

import com.example.openrunapi.domain.auth.model.dto.LoginResponse;
import com.example.openrunapi.domain.auth.model.dto.SocialLoginRequest;
import com.example.openrunapi.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login/kakao")
    public ResponseEntity<LoginResponse> kakaoLogin(@RequestParam String code) {
        LoginResponse response = authService.kakaoLogin(code);
        return ResponseEntity.ok(response);
    }
}
