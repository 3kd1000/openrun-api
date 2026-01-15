package com.example.openrunapi.domain.post.controller;

import com.example.openrunapi.domain.post.model.PostType;
import com.example.openrunapi.domain.post.model.dto.LikeResponse;
import com.example.openrunapi.domain.post.model.dto.PostRequest;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.service.PostService;
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

@RestController
@RequestMapping("/api/clubs/{clubId}/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserService userService;

    /**
     * 게시글 목록 조회 (페이징)
     * GET /api/clubs/{clubId}/posts?postType=NOTICE&page=0&size=30
     */
    @GetMapping
    public ResponseEntity<Page<PostResponse>> getPosts(
        @PathVariable Long clubId,
        @RequestParam(required = false) PostType postType,
        @PageableDefault(size = 30, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        Page<PostResponse> posts = postService.getPostsPaged(clubId, postType, currentUser.getId(), pageable);
        return ResponseEntity.ok(posts);
    }

    /**
     * 게시글 생성
     * POST /api/clubs/{clubId}/posts
     */
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
        @PathVariable Long clubId,
        @Valid @RequestBody PostRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = postService.createPost(clubId, request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    /**
     * 게시글 상세 조회
     * GET /api/clubs/{clubId}/posts/{postId}
     */
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long clubId,
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = postService.getPost(clubId, postId, currentUser.getId());
        return ResponseEntity.ok(post);
    }

    /**
     * 게시글 수정
     * PUT /api/clubs/{clubId}/posts/{postId}
     */
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long clubId,
            @PathVariable Long postId,
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        PostResponse post = postService.updatePost(clubId, postId, request, currentUser.getId());
        return ResponseEntity.ok(post);
    }

    /**
     * 게시글 삭제
     * DELETE /api/clubs/{clubId}/posts/{postId}
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        postService.deletePost(clubId, postId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * 게시글 좋아요 토글
     * POST /api/clubs/{clubId}/posts/{postId}/like
     */
    @PostMapping("/{postId}/like")
    public ResponseEntity<LikeResponse> toggleLike(
        @PathVariable Long clubId,
        @PathVariable Long postId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse currentUser = userService.getCurrentUser(userDetails.getUsername());
        LikeResponse response = postService.toggleLike(clubId, postId, currentUser.getId());
        return ResponseEntity.ok(response);
    }
}
