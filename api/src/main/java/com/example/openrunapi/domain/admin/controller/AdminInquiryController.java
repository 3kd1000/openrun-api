package com.example.openrunapi.domain.admin.controller;

import com.example.openrunapi.domain.admin.service.AdminUserService;
import com.example.openrunapi.domain.auth.service.OAuthService;
import com.example.openrunapi.domain.post.model.dto.CommentResponse;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.service.InquiryService;
import com.example.openrunapi.domain.user.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin 문의 관리 API
 * - System Admin 권한 필요
 */
@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;
    private final AdminUserService adminUserService;
    private final OAuthService oAuthService;

    /**
     * 전체 문의글 목록 조회
     * GET /api/admin/inquiries
     */
    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllInquiries(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<PostResponse> inquiries = inquiryService.getAllInquiries();
        return ResponseEntity.ok(inquiries);
    }

    /**
     * 문의글 상세 조회
     * GET /api/admin/inquiries/{postId}
     */
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getInquiry(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());

        PostResponse inquiry = inquiryService.getInquiryForAdmin(postId);
        return ResponseEntity.ok(inquiry);
    }

    /**
     * 문의글 댓글 목록 조회
     * GET /api/admin/inquiries/{postId}/comments
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getInquiryComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());

        List<CommentResponse> comments = inquiryService.getInquiryCommentsForAdmin(postId);
        return ResponseEntity.ok(comments);
    }

    /**
     * 문의글에 답변 작성
     * POST /api/admin/inquiries/{postId}/comments
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        adminUserService.validateAdminAccess(userDetails.getUsername());

        User adminUser = oAuthService.findUserByProviderUid(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        CommentResponse comment = inquiryService.addCommentForAdmin(postId, request.getContent(), adminUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @Getter
    public static class AddCommentRequest {
        @NotBlank(message = "답변 내용을 입력해주세요.")
        private String content;
    }
}
