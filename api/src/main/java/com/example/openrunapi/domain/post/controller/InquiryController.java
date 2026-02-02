package com.example.openrunapi.domain.post.controller;

import com.example.openrunapi.domain.post.model.dto.CommentRequest;
import com.example.openrunapi.domain.post.model.dto.CommentResponse;
import com.example.openrunapi.domain.post.model.dto.InquiryRequest;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.service.InquiryService;
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

/**
 * 서비스 문의 API
 * - 시스템 클럽("OpenRun 운영팀")에 INQUIRY Post로 문의 관리
 */
@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final UserService userService;

    /**
     * 내 문의글 목록 조회
     * GET /api/inquiries
     */
    @GetMapping
    public ResponseEntity<List<PostResponse>> getMyInquiries(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<PostResponse> inquiries = inquiryService.getMyInquiries(currentUser.getId());
        return ResponseEntity.ok(inquiries);
    }

    /**
     * 문의글 작성
     * POST /api/inquiries
     */
    @PostMapping
    public ResponseEntity<PostResponse> createInquiry(
            @Valid @RequestBody InquiryRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse inquiry = inquiryService.createInquiry(request.getContent(), currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(inquiry);
    }

    /**
     * 문의글 상세 조회
     * GET /api/inquiries/{postId}
     */
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getInquiry(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse inquiry = inquiryService.getInquiry(postId, currentUser.getId());
        return ResponseEntity.ok(inquiry);
    }

    /**
     * 문의글 댓글 목록 조회
     * GET /api/inquiries/{postId}/comments
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getInquiryComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<CommentResponse> comments = inquiryService.getInquiryComments(postId, currentUser.getId());
        return ResponseEntity.ok(comments);
    }

    /**
     * 문의글에 댓글 작성
     * POST /api/inquiries/{postId}/comments
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        CommentResponse comment = inquiryService.addComment(postId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
}
