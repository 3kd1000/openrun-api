package com.example.openrunapi.domain.post.service;

import com.example.openrunapi.common.exception.PermissionDeniedException;
import com.example.openrunapi.config.SystemConfig;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.post.model.Comment;
import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.PostType;
import com.example.openrunapi.domain.post.model.dto.CommentRequest;
import com.example.openrunapi.domain.post.model.dto.CommentResponse;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.repository.CommentRepository;
import com.example.openrunapi.domain.post.repository.PostRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.SystemAdminRepository;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 서비스 문의 관련 비즈니스 로직
 * - 시스템 클럽("OpenRun 운영팀")에 INQUIRY Post로 문의 관리
 * - 클럽 멤버 체크 우회 (누구나 문의 가능)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final SystemAdminRepository systemAdminRepository;
    private final SystemConfig systemConfig;

    /**
     * 시스템 클럽 조회
     */
    private Club getSystemClub() {
        return clubRepository.findByName(systemConfig.getInquiryClubName())
                .orElseThrow(() -> new IllegalStateException("시스템 클럽이 설정되지 않았습니다. 마이그레이션을 확인해주세요."));
    }

    /**
     * [Admin] 전체 문의글 목록 조회
     */
    public List<PostResponse> getAllInquiries() {
        Club systemClub = getSystemClub();

        List<Post> posts = postRepository.findByClubIdAndPostTypeAndNotDeleted(
                systemClub.getId(),
                PostType.INQUIRY
        );

        return posts.stream()
                .map(post -> PostResponse.from(post, false, false, false))
                .collect(Collectors.toList());
    }

    /**
     * [Admin] 문의글 상세 조회 (권한 체크 없음)
     */
    public PostResponse getInquiryForAdmin(Long postId) {
        Club systemClub = getSystemClub();

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        return PostResponse.from(post, false, false, false);
    }

    /**
     * [Admin] 문의글 댓글 목록 조회 (권한 체크 없음)
     */
    public List<CommentResponse> getInquiryCommentsForAdmin(Long postId) {
        Club systemClub = getSystemClub();

        postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        List<Comment> comments = commentRepository.findByPostIdAndNotDeleted(postId);

        return comments.stream()
                .map(comment -> CommentResponse.from(comment, false, false, false))
                .collect(Collectors.toList());
    }

    /**
     * [Admin] 문의글에 답변 작성
     */
    @Transactional
    public CommentResponse addCommentForAdmin(Long postId, String content, Long adminUserId) {
        Club systemClub = getSystemClub();

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = new Comment(post, adminUser, content);
        Comment savedComment = commentRepository.save(comment);

        post.incrementCommentCount();

        return CommentResponse.from(savedComment, false, true, true);
    }

    /**
     * 내 문의글 목록 조회
     */
    public List<PostResponse> getMyInquiries(Long userId) {
        Club systemClub = getSystemClub();

        List<Post> posts = postRepository.findByClubIdAndPostTypeAndAuthorIdAndNotDeleted(
                systemClub.getId(),
                PostType.INQUIRY,
                userId
        );

        return posts.stream()
                .map(post -> PostResponse.from(post, false, true, true))
                .collect(Collectors.toList());
    }

    /**
     * 문의글 상세 조회
     * - 본인 작성 문의만 조회 가능
     */
    public PostResponse getInquiry(Long postId, Long userId) {
        Club systemClub = getSystemClub();

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        validateInquiryAccess(post, userId);

        return PostResponse.from(post, false, true, true);
    }

    /**
     * 문의글 작성
     */
    @Transactional
    public PostResponse createInquiry(String content, Long userId) {
        Club systemClub = getSystemClub();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Post post = new Post(systemClub, user, PostType.INQUIRY, content);
        Post savedPost = postRepository.save(post);

        return PostResponse.from(savedPost, false, true, true);
    }

    /**
     * 문의글 댓글 목록 조회
     */
    public List<CommentResponse> getInquiryComments(Long postId, Long userId) {
        Club systemClub = getSystemClub();

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        validateInquiryAccess(post, userId);

        List<Comment> comments = commentRepository.findByPostIdAndNotDeleted(postId);

        return comments.stream()
                .map(comment -> CommentResponse.from(
                        comment,
                        false,
                        comment.getAuthor().getId().equals(userId),
                        comment.getAuthor().getId().equals(userId)
                ))
                .collect(Collectors.toList());
    }

    /**
     * 문의글에 댓글 작성
     * - 본인 작성 문의 또는 SystemAdmin만 가능
     */
    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, Long userId) {
        Club systemClub = getSystemClub();

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, systemClub.getId())
                .orElseThrow(() -> new IllegalArgumentException("문의글을 찾을 수 없습니다."));

        validateCommentAccess(post, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = new Comment(post, user, request.getContent());
        Comment savedComment = commentRepository.save(comment);

        post.incrementCommentCount();

        return CommentResponse.from(savedComment, false, true, true);
    }

    /**
     * 문의글 접근 권한 확인
     * - 본인 작성 문의 또는 SystemAdmin만 접근 가능
     */
    private void validateInquiryAccess(Post post, Long userId) {
        boolean isAuthor = post.getAuthor() != null && post.getAuthor().getId().equals(userId);
        boolean isSystemAdmin = systemAdminRepository.existsByUserId(userId);

        if (!isAuthor && !isSystemAdmin) {
            throw new PermissionDeniedException("해당 문의글에 접근할 권한이 없습니다.");
        }
    }

    /**
     * 댓글 작성 권한 확인
     * - 본인 작성 문의 또는 SystemAdmin만 댓글 가능
     */
    private void validateCommentAccess(Post post, Long userId) {
        validateInquiryAccess(post, userId);
    }
}
