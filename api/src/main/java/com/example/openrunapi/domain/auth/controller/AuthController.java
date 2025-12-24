package com.example.openrunapi.domain.auth.controller;

import com.example.openrunapi.domain.auth.model.dto.GoogleLoginRequest;
import com.example.openrunapi.domain.auth.model.dto.LoginResponse;
import com.example.openrunapi.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login/google")
    public ResponseEntity<LoginResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        LoginResponse response = authService.googleLogin(request.getIdToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/kakao")
    public ResponseEntity<LoginResponse> kakaoLogin(@RequestParam String code) {
        LoginResponse response = authService.kakaoLogin(code);
        return ResponseEntity.ok(response);
    }
}
