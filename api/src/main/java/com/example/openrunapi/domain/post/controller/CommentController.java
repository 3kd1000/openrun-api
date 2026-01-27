package com.example.openrunapi.domain.post.controller;

import com.example.openrunapi.domain.post.model.dto.CommentRequest;
import com.example.openrunapi.domain.post.model.dto.CommentResponse;
import com.example.openrunapi.domain.post.model.dto.LikeResponse;
import com.example.openrunapi.domain.post.service.CommentService;
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
@RequestMapping("/api/clubs/{clubId}/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;

    /**
     * 댓글 목록 조회
     * GET /api/clubs/{clubId}/posts/{postId}/comments
     */
    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        List<CommentResponse> comments = commentService.getComments(clubId, postId, currentUser.getId());
        return ResponseEntity.ok(comments);
    }

    /**
     * 댓글 생성
     * POST /api/clubs/{clubId}/posts/{postId}/comments
     */
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @Valid @RequestBody CommentRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        CommentResponse comment = commentService.createComment(clubId, postId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * 댓글 삭제
     * DELETE /api/clubs/{clubId}/posts/{postId}/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @PathVariable Long commentId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        commentService.deleteComment(clubId, postId, commentId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 댓글 좋아요 토글
     * POST /api/clubs/{clubId}/posts/{postId}/comments/{commentId}/like
     */
    @PostMapping("/{commentId}/like")
    public ResponseEntity<LikeResponse> toggleLike(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @PathVariable Long commentId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        LikeResponse response = commentService.toggleLike(clubId, postId, commentId, currentUser.getId());
        return ResponseEntity.ok(response);
    }
}
