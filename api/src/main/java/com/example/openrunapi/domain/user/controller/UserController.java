package com.example.openrunapi.domain.user.controller;

import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.user.model.dto.OAuthProviderResponse;
import com.example.openrunapi.domain.user.model.dto.UpdateUserRequest;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
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
}
