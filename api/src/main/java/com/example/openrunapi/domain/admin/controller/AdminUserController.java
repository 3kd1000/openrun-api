package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.user.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin 사용자 관리 API
 * - 운영용 API (화면 미노출)
 * - System Admin 권한 필요
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * 사용자 연락처 업데이트 (이름으로 검색)
     * - userName으로 사용자를 찾아 phoneNumber를 업데이트
     * - JPA @Convert로 자동 암호화됨
     */
    @PutMapping("/phone")
    public ResponseEntity<?> updatePhoneByName(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdatePhoneRequest request) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        User updatedUser = adminUserService.updatePhoneByName(
                request.getUserName(),
                request.getPhoneNumber()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", updatedUser.getId(),
                "userName", updatedUser.getName(),
                "message", "연락처가 업데이트되었습니다."
        ));
    }

    /**
     * 사용자 생년월일 업데이트 (이름으로 검색)
     * - userName으로 사용자를 찾아 birthDate를 업데이트
     * - JPA @Convert로 자동 암호화됨
     */
    @PutMapping("/birth-date")
    public ResponseEntity<?> updateBirthDateByName(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateBirthDateRequest request) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        User updatedUser = adminUserService.updateBirthDateByName(
                request.getUserName(),
                request.getBirthDate()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "userId", updatedUser.getId(),
                "userName", updatedUser.getName(),
                "message", "생년월일이 업데이트되었습니다."
        ));
    }

    /**
     * 연락처 업데이트 요청 DTO
     */
    @Getter
    public static class UpdatePhoneRequest {
        @NotBlank(message = "사용자 이름은 필수입니다.")
        private String userName;

        @NotBlank(message = "연락처는 필수입니다.")
        private String phoneNumber;
    }

    /**
     * 생년월일 업데이트 요청 DTO
     */
    @Getter
    public static class UpdateBirthDateRequest {
        @NotBlank(message = "사용자 이름은 필수입니다.")
        private String userName;

        @NotBlank(message = "생년월일은 필수입니다.")
        private String birthDate;
    }
}
