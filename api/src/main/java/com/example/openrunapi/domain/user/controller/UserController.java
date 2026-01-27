package com.example.openrunapi.domain.user.controller;

import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.user.model.dto.OAuthProviderResponse;
import com.example.openrunapi.domain.user.model.dto.UpdateUserProfileRequest;
import com.example.openrunapi.domain.user.model.dto.MyRecentMatchResponse;
import com.example.openrunapi.domain.user.model.dto.UpdateUserRequest;
import com.example.openrunapi.domain.user.model.dto.UserProfileResponse;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.model.dto.UserTotalStatsResponse;
import com.example.openrunapi.domain.user.model.dto.MyAllMatchPageResponse;
import com.example.openrunapi.domain.user.service.UserService;
import com.example.openrunapi.domain.schedule.model.dto.MyScheduleResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ClubService clubService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        // userDetails.getUsername() 에는 우리 시스템의 경우 Firebase uid가 들어있습니다.
        UserResponse response = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse response = userService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateUserProfileRequest request
    ) {
        UserProfileResponse response = userService.updateMyProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateUser(@AuthenticationPrincipal UserDetails userDetails,
                                                 @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateUser(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUser(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /**
     * 게스트 사용자 목록 조회 (게스트1~16)
     */
    @GetMapping("/guests")
    public ResponseEntity<java.util.List<UserResponse>> getGuestUsers() {
        java.util.List<UserResponse> guests = userService.getGuestUsers();
        return ResponseEntity.ok(guests);
    }

    /**
     * 현재 사용자의 OAuth 제공자 목록 조회
     */
    @GetMapping("/me/oauth-providers")
    public ResponseEntity<java.util.List<OAuthProviderResponse>> getUserOAuthProviders(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        java.util.List<OAuthProviderResponse> providers = userService.getUserOAuthProviders(userDetails.getUsername());
        return ResponseEntity.ok(providers);
    }

    /**
     * 현재 사용자가 가입한 클럽 목록 조회
     */
    @GetMapping("/me/clubs")
    public ResponseEntity<java.util.List<ClubResponse>> getUserClubs(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        java.util.List<ClubResponse> clubs = clubService.getMyClubs(currentUserResponse.getId());
        return ResponseEntity.ok(clubs);
    }

    /**
     * 내가 참가한 모든 일정 조회 (개인일정)
     * - ScheduleParticipant + ExternalRequest 조합
     * - 클럽 멤버로 참가한 일정 + 게스트로 신청한 일정
     *
     * @param userDetails 현재 사용자 정보
     * @param upcoming true면 미래 일정만 조회
     * @return 내 일정 목록
     */
    @GetMapping("/me/schedules")
    public ResponseEntity<java.util.List<MyScheduleResponse>> getMySchedules(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Boolean upcoming
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        java.util.List<MyScheduleResponse> schedules = userService.getMySchedules(
                currentUserResponse.getId(),
                upcoming
        );
        return ResponseEntity.ok(schedules);
    }

    /**
     * 특정 클럽에서의 내 최근 전적 조회
     *
     * @param userDetails 현재 사용자 정보
     * @param clubId      클럽 ID (필수)
     * @param limit       조회할 경기 수 (기본 5)
     * @return 최근 전적 목록
     */
    @GetMapping("/me/matches")
    public ResponseEntity<java.util.List<MyRecentMatchResponse>> getMyRecentMatches(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long clubId,
            @RequestParam(required = false, defaultValue = "5") Integer limit
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        java.util.List<MyRecentMatchResponse> matches = userService.getMyRecentMatches(
                currentUserResponse.getId(),
                clubId,
                limit
        );
        return ResponseEntity.ok(matches);
    }

    /**
     * 개인 전체 통계 조회 (모든 클럽 합산)
     *
     * @param userDetails 현재 사용자 정보
     * @return 전체 통계 (승/무/패/총경기수)
     */
    @GetMapping("/me/stats/total")
    public ResponseEntity<UserTotalStatsResponse> getMyTotalStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        UserTotalStatsResponse stats = userService.getMyTotalStats(currentUserResponse.getId());
        return ResponseEntity.ok(stats);
    }

    /**
     * 개인 전체 경기 기록 조회 (모든 클럽, 페이징)
     *
     * @param userDetails 현재 사용자 정보
     * @param page        페이지 번호 (0부터 시작)
     * @param size        페이지 크기
     * @return 페이징된 경기 목록
     */
    @GetMapping("/me/matches/all")
    public ResponseEntity<MyAllMatchPageResponse> getMyAllMatches(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        MyAllMatchPageResponse matches = userService.getMyAllMatches(
                currentUserResponse.getId(),
                page,
                size
        );
        return ResponseEntity.ok(matches);
    }
}
