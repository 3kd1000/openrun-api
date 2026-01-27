package com.example.openrunapi.domain.post.service;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.post.model.Comment;
import com.example.openrunapi.domain.post.model.CommentLike;
import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.dto.CommentRequest;
import com.example.openrunapi.domain.post.model.dto.CommentResponse;
import com.example.openrunapi.domain.post.model.dto.LikeResponse;
import com.example.openrunapi.domain.post.repository.CommentLikeRepository;
import com.example.openrunapi.domain.post.repository.CommentRepository;
import com.example.openrunapi.domain.post.repository.PostRepository;
import com.example.openrunapi.domain.externalrequest.repository.ExternalRequestRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ExternalRequestRepository externalRequestRepository;
    private final UserRepository userRepository;

    /**
     * 댓글/스레드 접근 가능 여부 확인
     * - 클럽 멤버면 허용
     * - 비멤버라도 external_request로 연결된 문의 스레드의 요청자면 허용
     */
    private void validateThreadAccess(Long clubId, Long postId, Long userId) {
        Optional<ClubMember> memberOpt = clubMemberRepository.findByClubIdAndUserId(clubId, userId);
        if (memberOpt.isPresent()) return;

        boolean isRequester = externalRequestRepository.findByPostIdAndRequesterId(postId, userId).isPresent();
        if (isRequester) return;

        // external_request가 아직 연결되지 않은 스레드라도 작성자는 접근 가능해야 함
        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (post.getAuthor() != null && post.getAuthor().getId().equals(userId)) return;

        throw new IllegalArgumentException("해당 클럽의 멤버가 아닙니다.");
    }

    private User resolveUser(Long clubId, Long userId) {
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .map(ClubMember::getUser)
                .orElseGet(() -> userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")));
    }

    /**
     * 댓글 목록 조회
     */
    public List<CommentResponse> getComments(Long clubId, Long postId, Long userId) {
        validateThreadAccess(clubId, postId, userId);

        // 게시글 존재 여부 확인
        postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        List<Comment> comments = commentRepository.findByPostIdAndNotDeleted(postId);

        List<Long> commentIds = comments.stream().map(Comment::getId).collect(Collectors.toList());
        List<Long> likedCommentIds = commentLikeRepository.findLikedCommentIdsByUserIdAndCommentIds(userId, commentIds);

        return comments.stream()
            .map(comment -> CommentResponse.from(
                comment,
                likedCommentIds.contains(comment.getId()),
                comment.getAuthor().getId().equals(userId),
                comment.getAuthor().getId().equals(userId)
            ))
            .collect(Collectors.toList());
    }

    /**
     * 댓글 생성
     */
    @Transactional
    public CommentResponse createComment(Long clubId, Long postId, CommentRequest request, Long userId) {
        validateThreadAccess(clubId, postId, userId);

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        User user = resolveUser(clubId, userId);

        Comment comment = new Comment(post, user, request.getContent());
        Comment savedComment = commentRepository.save(comment);

        post.incrementCommentCount();

        return CommentResponse.from(savedComment, false, true, true);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long clubId, Long postId, Long commentId, Long userId) {
        validateThreadAccess(clubId, postId, userId);

        Comment comment = commentRepository.findByIdAndPostIdAndNotDeleted(commentId, postId)
            .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("댓글 작성자만 삭제할 수 있습니다.");
        }

        comment.softDelete();
        comment.getPost().decrementCommentCount();
    }

    /**
     * 댓글 좋아요 토글
     */
    @Transactional
    public LikeResponse toggleLike(Long clubId, Long postId, Long commentId, Long userId) {
        validateThreadAccess(clubId, postId, userId);

        Comment comment = commentRepository.findByIdAndPostIdAndNotDeleted(commentId, postId)
            .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        User user = resolveUser(clubId, userId);

        Optional<CommentLike> likeOpt = commentLikeRepository.findByCommentIdAndUserId(commentId, userId);

        if (likeOpt.isPresent()) {
            // 좋아요 취소
            commentLikeRepository.delete(likeOpt.get());
            comment.decrementLikeCount();
            return LikeResponse.of(false, comment.getLikeCount());
        } else {
            // 좋아요 추가
            CommentLike like = new CommentLike(comment, user);
            commentLikeRepository.save(like);
            comment.incrementLikeCount();
            return LikeResponse.of(true, comment.getLikeCount());
        }
    }
}
