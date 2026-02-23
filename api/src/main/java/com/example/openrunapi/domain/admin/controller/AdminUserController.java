package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.model.dto.DailyStatsHistoryResponse;
import com.example.openrunapi.domain.admin.model.dto.UserStatsResponse;
import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.admin.service.DailyStatsService;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    private final DailyStatsService dailyStatsService;
    private final UserRepository userRepository;

    /**
     * 사용자 통계 조회 (대시보드용)
     * - 전체 사용자 수, DAU, WAU, MAU
     * - 신규 가입자 수 (오늘/이번 주/이번 달)
     */
    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getUserStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        UserStatsResponse stats = adminUserService.getUserStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * 통계 히스토리 조회 (차트용)
     * - 기간별 일일 통계 데이터
     *
     * @param period 조회 기간 (1M, 3M, 6M, 1Y) - 기본값 1M
     */
    @GetMapping("/stats/history")
    public ResponseEntity<DailyStatsHistoryResponse> getStatsHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1M") String period) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        DailyStatsHistoryResponse history = dailyStatsService.getStatsHistory(period);
        return ResponseEntity.ok(history);
    }

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
     * 사용자 이름 검색 (DM 발송 대상 선택용)
     * - 이름에 keyword가 포함된 실사용자(비게스트) 최대 20명 반환
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String keyword) {

        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<UserResponse> results = userRepository
                .searchByNameKeyword(keyword.trim(), PageRequest.of(0, 20))
                .stream()
                .map(UserResponse::new)
                .toList();
        return ResponseEntity.ok(results);
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
