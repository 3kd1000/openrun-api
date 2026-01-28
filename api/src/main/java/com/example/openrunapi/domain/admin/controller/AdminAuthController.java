package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.SystemAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin 인증 API
 * Firebase 토큰으로 인증된 사용자가 System Admin인지 확인
 */
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final SystemAdminRepository systemAdminRepository;
    private final OAuthService oauthService;

    /**
     * 현재 로그인한 사용자가 System Admin인지 확인
     * - 인증되지 않은 경우: 401
     * - 인증됐지만 System Admin이 아닌 경우: 403
     * - System Admin인 경우: 200 + 사용자 정보
     */
    @GetMapping("/me")
    public ResponseEntity<?> checkAdminStatus(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "인증이 필요합니다."));
        }

        // Firebase UID로 User 조회
        String firebaseUid = userDetails.getUsername();
        User user = oauthService.findUserByProviderUid(firebaseUid).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "사용자를 찾을 수 없습니다."));
        }

        boolean isSystemAdmin = systemAdminRepository.existsByUserId(user.getId());

        if (!isSystemAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "System Admin 권한이 없습니다."));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "isSystemAdmin", true
        ));
    }
}
