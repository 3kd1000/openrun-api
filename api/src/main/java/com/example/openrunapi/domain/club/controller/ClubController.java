package com.example.openrunapi.domain.club.controller;

import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.service.ClubService;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ClubResponse> createClub(@Valid @RequestBody CreateClubRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        ClubResponse response = clubService.createClub(request, currentUserResponse.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<ClubResponse> findClub(@PathVariable Long clubId) {
        ClubResponse response = clubService.findClub(clubId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ClubResponse>> findClubs(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClubResponse> responses = clubService.findClubs(keyword, pageable);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{clubId}")
    public ResponseEntity<ClubResponse> updateClub(@PathVariable Long clubId,
            @Valid @RequestBody UpdateClubRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        ClubResponse response = clubService.updateClub(clubId, request, currentUserResponse.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{clubId}")
    public ResponseEntity<Void> deleteClub(@PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.deleteClub(clubId, currentUserResponse.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{clubId}/join")
    public ResponseEntity<Void> joinRequest(@PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.joinRequest(clubId, currentUserResponse.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{clubId}/members/{userId}/approve")
    public ResponseEntity<Void> approveMember(@PathVariable Long clubId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.approveMember(clubId, currentUserResponse.getId(), userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{clubId}/members/{userId}/reject")
    public ResponseEntity<Void> rejectMember(@PathVariable Long clubId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.rejectMember(clubId, currentUserResponse.getId(), userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{clubId}/members")
    public ResponseEntity<List<UserResponse>> getClubMembers(@PathVariable Long clubId,
            @RequestParam(required = false) ClubMemberStatus status) {
        List<UserResponse> members = clubService.getClubMembers(clubId, status);
        return ResponseEntity.ok(members);
    }

    /**
     * 클럽 탈퇴 (사용자가 자신이 가입한 클럽에서 탈퇴)
     */
    @DeleteMapping("/{clubId}/members/me")
    public ResponseEntity<Void> leaveClub(@PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.leaveClub(clubId, currentUserResponse.getId());
        return ResponseEntity.noContent().build();
    }
}
