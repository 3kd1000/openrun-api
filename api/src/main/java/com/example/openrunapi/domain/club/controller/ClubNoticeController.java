package com.example.openrunapi.domain.club.controller;

import com.example.openrunapi.domain.club.model.dto.ClubContentUnreadCountResponse;
import com.example.openrunapi.domain.club.model.dto.ClubNoticeResponse;
import com.example.openrunapi.domain.club.model.dto.ClubNoticeUnreadCountResponse;
import com.example.openrunapi.domain.club.model.dto.CreateClubNoticeRequest;
import com.example.openrunapi.domain.club.model.dto.MarkClubNoticesReadRequest;
import com.example.openrunapi.domain.club.model.dto.UpdateClubNoticeRequest;
import com.example.openrunapi.domain.club.service.ClubNoticeService;
import com.example.openrunapi.domain.club.service.ClubRuleService;
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
@RequestMapping("/api/clubs/{clubId}/notices")
@RequiredArgsConstructor
public class ClubNoticeController {

    private final ClubNoticeService clubNoticeService;
    private final ClubRuleService clubRuleService;
    private final UserService userService;

    /**
     * 공지사항 목록 조회 (클럽 멤버)
     */
    @GetMapping
    public ResponseEntity<List<ClubNoticeResponse>> getClubNotices(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<ClubNoticeResponse> notices = clubNoticeService.getClubNotices(clubId, currentUser.getId());
        return ResponseEntity.ok(notices);
    }

    /**
     * unread 개수 조회 (클럽 멤버) - 공지사항만
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ClubNoticeUnreadCountResponse> getUnreadCount(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(clubNoticeService.getUnreadCount(clubId, currentUser.getId()));
    }

    /**
     * 공지사항 + 회칙 통합 unread 개수 조회 (클럽 멤버)
     */
    @GetMapping("/content-unread-count")
    public ResponseEntity<ClubContentUnreadCountResponse> getContentUnreadCount(
            @PathVariable Long clubId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        Long userId = currentUser.getId();
        long noticeUnread = clubNoticeService.getUnreadCount(clubId, userId).getUnreadCount();
        long ruleUnread = clubRuleService.getUnreadCount(clubId, userId);
        return ResponseEntity.ok(new ClubContentUnreadCountResponse(noticeUnread, ruleUnread));
    }

    /**
     * 읽음 처리 (클럽 멤버)
     * - upToNoticeId 이하 공지를 읽음 처리 (null이면 최신 공지까지)
     */
    @PostMapping("/mark-read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long clubId,
            @RequestBody(required = false) MarkClubNoticesReadRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubNoticeService.markRead(clubId, request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * 공지사항 생성 (ADMIN/OWNER)
     */
    @PostMapping
    public ResponseEntity<ClubNoticeResponse> createClubNotice(
            @PathVariable Long clubId,
            @Valid @RequestBody CreateClubNoticeRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ClubNoticeResponse response = clubNoticeService.createClubNotice(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 공지사항 수정 (ADMIN/OWNER)
     */
    @PutMapping("/{noticeId}")
    public ResponseEntity<ClubNoticeResponse> updateClubNotice(
            @PathVariable Long clubId,
            @PathVariable Long noticeId,
            @Valid @RequestBody UpdateClubNoticeRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        ClubNoticeResponse response = clubNoticeService.updateClubNotice(clubId, noticeId, request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 삭제 (ADMIN/OWNER)
     */
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> deleteClubNotice(
            @PathVariable Long clubId,
            @PathVariable Long noticeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        clubNoticeService.deleteClubNotice(clubId, noticeId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}

