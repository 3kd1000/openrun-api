package com.example.openrunapi.domain.club.controller;

import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.model.MemberRecruitmentStatus;
import com.example.openrunapi.domain.club.model.dto.ClubMembershipResponse;
import com.example.openrunapi.domain.club.model.dto.ClubResponse;
import com.example.openrunapi.domain.club.model.dto.MemberProfileResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubMemberRolesRequest;
import com.example.openrunapi.domain.club.model.dto.JoinRequestResponse;
import com.example.openrunapi.domain.club.model.dto.TransferOwnershipRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateAwardPolicyRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubPolicyRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubRequest;
import com.example.openrunapi.domain.club.service.ClubService;
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
import org.springframework.web.multipart.MultipartFile;

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
            @RequestParam(required = false) String region,
            @RequestParam(required = false) MemberRecruitmentStatus memberRecruitmentStatus,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClubResponse> responses = clubService.findClubs(keyword, region, memberRecruitmentStatus, pageable);
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

    /**
     * 클럽 운영 정책 수정 (가입 승인 방식/교류전 모집 상태) - 운영진 이상
     */
    @PatchMapping("/{clubId}/policy")
    public ResponseEntity<ClubResponse> updateClubPolicy(
            @PathVariable Long clubId,
            @RequestBody UpdateClubPolicyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        ClubResponse response = clubService.updateClubPolicy(clubId, request, currentUserResponse.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 클럽 어워드 정책 수정 (정산 주기/어워드 타입 활성화) - 운영진 이상
     */
    @PatchMapping("/{clubId}/award-policy")
    public ResponseEntity<ClubResponse> updateAwardPolicy(
            @PathVariable Long clubId,
            @RequestBody UpdateAwardPolicyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        ClubResponse response = clubService.updateAwardPolicy(clubId, request, currentUserResponse.getId());
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
    public ResponseEntity<JoinRequestResponse> joinRequest(@PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        JoinRequestResponse response = clubService.joinRequest(clubId, currentUserResponse.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * @deprecated Use ExternalRequestService.approve() instead
     */
    @Deprecated
    @PostMapping("/{clubId}/members/{userId}/approve")
    public ResponseEntity<Void> approveMember(@PathVariable Long clubId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.approveMember(clubId, currentUserResponse.getId(), userId);
        return ResponseEntity.ok().build();
    }

    /**
     * @deprecated Use ExternalRequestService.reject() instead
     */
    @Deprecated
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
     * 클럽 멤버 프로필 조회 (User + UserProfile + ClubMember 통합)
     * - 연락처 정보는 ContactVisibility에 따라 필터링됨
     */
    @GetMapping("/{clubId}/members/{userId}")
    public ResponseEntity<MemberProfileResponse> getMemberProfile(
            @PathVariable Long clubId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        MemberProfileResponse profile = clubService.getMemberProfile(clubId, userId, currentUserResponse.getId());
        return ResponseEntity.ok(profile);
    }

    /**
     * 클럽원 상세 정보 조회 (명단 조회용)
     * - ClubMember 정보 (role, status, joinedAt) + User 연락처 정보 포함
     */
    @GetMapping("/{clubId}/membership")
    public ResponseEntity<List<ClubMembershipResponse>> getClubMembership(@PathVariable Long clubId,
            @RequestParam(required = false) ClubMemberStatus status) {
        List<ClubMembershipResponse> membership = clubService.getClubMembership(clubId, status);
        return ResponseEntity.ok(membership);
    }

    /**
     * 클럽원 역할 배치 변경 - OWNER(또는 System Admin)
     */
    @PatchMapping("/{clubId}/members/roles")
    public ResponseEntity<List<ClubMembershipResponse>> updateMemberRoles(
            @PathVariable Long clubId,
            @Valid @RequestBody UpdateClubMemberRolesRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        List<ClubMembershipResponse> res = clubService.updateMemberRoles(clubId, currentUserResponse.getId(), request);
        return ResponseEntity.ok(res);
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

    /**
     * 클럽원 제명 (ADMIN 이상이 다른 회원을 제명)
     */
    @DeleteMapping("/{clubId}/members/{memberId}")
    public ResponseEntity<Void> kickMember(@PathVariable Long clubId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.kickMember(clubId, currentUserResponse.getId(), memberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 클럽 로고 업로드 - ADMIN 이상 가능, 감사 로그 기록
     */
    @PostMapping("/{clubId}/logo")
    public ResponseEntity<ClubResponse> uploadClubLogo(
            @PathVariable Long clubId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        ClubResponse response = clubService.uploadClubLogo(clubId, currentUserResponse.getId(), file);
        return ResponseEntity.ok(response);
    }

    /**
     * 클럽 로고 삭제 - ADMIN 이상 가능, 감사 로그 기록
     */
    @DeleteMapping("/{clubId}/logo")
    public ResponseEntity<Void> deleteClubLogo(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.deleteClubLogo(clubId, currentUserResponse.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 클럽장 권한 양도 (OWNER만 가능)
     * - ACTIVE 멤버 누구에게든 양도 가능
     * - 기존 OWNER → ADMIN, 새 OWNER → OWNER로 역할 변경
     */
    @PostMapping("/{clubId}/transfer-ownership")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable Long clubId,
            @Valid @RequestBody TransferOwnershipRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUserResponse = userService.getCurrentUser(userDetails.getUsername());
        clubService.transferOwnership(clubId, currentUserResponse.getId(), request);
        return ResponseEntity.ok().build();
    }
}
