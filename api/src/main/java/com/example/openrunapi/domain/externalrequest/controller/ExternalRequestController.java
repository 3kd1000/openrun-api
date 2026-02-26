package com.example.openrunapi.domain.externalrequest.controller;

import com.example.openrunapi.domain.externalrequest.model.ExternalRequestStatus;
import com.example.openrunapi.domain.externalrequest.model.ExternalRequestType;
import com.example.openrunapi.domain.externalrequest.model.dto.CreateInquiryForExternalRequestRequest;
import com.example.openrunapi.domain.externalrequest.model.dto.DecideExternalRequestRequest;
import com.example.openrunapi.domain.externalrequest.model.dto.ExternalRequestResponse;
import com.example.openrunapi.domain.externalrequest.service.ExternalRequestService;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.user.model.dto.UserResponse;
import com.example.openrunapi.domain.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExternalRequestController {

    private final ExternalRequestService externalRequestService;
    private final UserService userService;

    /**
     * 클럽 관리용 외부요청 인박스 조회 - 운영진 이상
     */
    @GetMapping("/api/clubs/{clubId}/external-requests")
    public ResponseEntity<List<ExternalRequestResponse>> listForClub(
            @PathVariable Long clubId,
            @RequestParam(required = false) ExternalRequestType type,
            @RequestParam(required = false) ExternalRequestStatus status,
            @RequestParam(required = false) Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<ExternalRequestResponse> list = externalRequestService.listForClub(clubId, type, status, postId, currentUser.getId());
        return ResponseEntity.ok(list);
    }

    /**
     * 게스트 모집 참가 신청 (일정 기반)
     */
    @PostMapping("/api/clubs/{clubId}/guest-recruit/{scheduleId}/apply")
    public ResponseEntity<ExternalRequestResponse> applyGuest(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.applyGuestRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @DeleteMapping("/api/clubs/{clubId}/guest-recruit/{scheduleId}/apply")
    public ResponseEntity<ExternalRequestResponse> cancelGuest(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.cancelGuestRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/clubs/{clubId}/guest-recruit/{scheduleId}/my-request")
    public ResponseEntity<ExternalRequestResponse> myGuest(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.getMyGuestRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    /**
     * 게스트 모집 문의글 생성 (게시판 문의글로 저장)
     */
    @PostMapping("/api/clubs/{clubId}/guest-recruit/{scheduleId}/inquiry")
    public ResponseEntity<PostResponse> createGuestInquiry(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateInquiryForExternalRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = externalRequestService.createGuestRecruitInquiry(clubId, scheduleId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    /**
     * 교류전 모집 참가 신청 (일정 기반)
     */
    @PostMapping("/api/clubs/{clubId}/interclub-recruit/{scheduleId}/apply")
    public ResponseEntity<ExternalRequestResponse> applyInterclub(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.applyInterclubRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @DeleteMapping("/api/clubs/{clubId}/interclub-recruit/{scheduleId}/apply")
    public ResponseEntity<ExternalRequestResponse> cancelInterclub(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.cancelInterclubRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/clubs/{clubId}/interclub-recruit/{scheduleId}/my-request")
    public ResponseEntity<ExternalRequestResponse> myInterclub(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.getMyInterclubRecruit(clubId, scheduleId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    /**
     * 교류전 모집 문의글 생성 (게시판 문의글로 저장)
     */
    @PostMapping("/api/clubs/{clubId}/interclub-recruit/{scheduleId}/inquiry")
    public ResponseEntity<PostResponse> createInterclubInquiry(
            @PathVariable Long clubId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateInquiryForExternalRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = externalRequestService.createInterclubRecruitInquiry(clubId, scheduleId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    /**
     * 가입 문의글 생성 (클럽 단위, 1 사용자 1 스레드)
     */
    @PostMapping("/api/clubs/{clubId}/join/inquiry")
    public ResponseEntity<PostResponse> createJoinInquiry(
            @PathVariable Long clubId,
            @Valid @RequestBody CreateInquiryForExternalRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = externalRequestService.createJoinInquiry(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping("/api/clubs/{clubId}/join/my-request")
    public ResponseEntity<ExternalRequestResponse> myJoin(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.getMyJoinRequest(clubId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    /**
     * 클럽 가입 신청 취소 (PENDING 상태에서만 가능)
     */
    @DeleteMapping("/api/clubs/{clubId}/join/apply")
    public ResponseEntity<ExternalRequestResponse> cancelJoin(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.cancelJoinRequest(clubId, currentUser.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/clubs/{clubId}/external-requests/{requestId}/approve")
    public ResponseEntity<ExternalRequestResponse> approve(
            @PathVariable Long clubId,
            @PathVariable Long requestId,
            @RequestBody(required = false) DecideExternalRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.approve(clubId, requestId, currentUser.getId(), request != null ? request.getNote() : null);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/clubs/{clubId}/external-requests/{requestId}/reject")
    public ResponseEntity<ExternalRequestResponse> reject(
            @PathVariable Long clubId,
            @PathVariable Long requestId,
            @RequestBody(required = false) DecideExternalRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ExternalRequestResponse res = externalRequestService.reject(clubId, requestId, currentUser.getId(), request != null ? request.getNote() : null);
        return ResponseEntity.ok(res);
    }
}

