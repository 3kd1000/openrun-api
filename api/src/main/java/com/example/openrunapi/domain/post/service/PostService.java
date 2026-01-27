package com.example.openrunapi.domain.post.service;

import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.externalrequest.repository.ExternalRequestRepository;
import com.example.openrunapi.domain.post.model.Post;
import com.example.openrunapi.domain.post.model.PostType;
import com.example.openrunapi.domain.post.model.dto.LikeResponse;
import com.example.openrunapi.domain.post.model.dto.PostRequest;
import com.example.openrunapi.domain.post.model.dto.PostResponse;
import com.example.openrunapi.domain.post.model.PostLike;
import com.example.openrunapi.domain.post.repository.PostLikeRepository;
import com.example.openrunapi.domain.post.repository.PostRepository;
import com.example.openrunapi.domain.user.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ExternalRequestRepository externalRequestRepository;

    /**
     * 클럽 멤버인지 확인
     */
    private void validateClubMember(Long clubId, Long userId) {
        Optional<ClubMember> memberOpt = clubMemberRepository.findByClubIdAndUserId(clubId, userId);
        if (memberOpt.isEmpty()) {
            throw new IllegalArgumentException("해당 클럽의 멤버가 아닙니다.");
        }
    }

    private void validateThreadAccess(Long clubId, Long postId, Long userId) {
        Optional<ClubMember> memberOpt = clubMemberRepository.findByClubIdAndUserId(clubId, userId);
        if (memberOpt.isPresent()) return;

        boolean isRequester = externalRequestRepository.findByPostIdAndRequesterId(postId, userId).isPresent();
        if (isRequester) return;

        // author가 비클럽원인 케이스도 방어적으로 허용
        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (post.getAuthor() != null && post.getAuthor().getId().equals(userId)) return;

        throw new IllegalArgumentException("해당 클럽의 멤버가 아닙니다.");
    }

    /**
     * 게시글 목록 조회
     */
    public List<PostResponse> getPosts(Long clubId, PostType postType, Long userId) {
        validateClubMember(clubId, userId);

        List<Post> posts = (postType == null)
            ? postRepository.findByClubIdAndNotDeleted(clubId)
            : postRepository.findByClubIdAndPostTypeAndNotDeleted(clubId, postType);

        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        List<Long> likedPostIds = postLikeRepository.findLikedPostIdsByUserIdAndPostIds(userId, postIds);

        return posts.stream()
            .map(post -> PostResponse.from(
                post,
                likedPostIds.contains(post.getId()),
                post.getAuthor() != null && post.getAuthor().getId().equals(userId),
                post.getAuthor() != null && post.getAuthor().getId().equals(userId)
            ))
            .collect(Collectors.toList());
    }

    /**
     * 게시글 목록 조회 (페이징)
     */
    public Page<PostResponse> getPostsPaged(Long clubId, PostType postType, Long userId, Pageable pageable) {
        validateClubMember(clubId, userId);

        Page<Post> postsPage = (postType == null)
            ? postRepository.findByClubIdAndNotDeletedPaged(clubId, pageable)
            : postRepository.findByClubIdAndPostTypeAndNotDeletedPaged(clubId, postType, pageable);

        List<Long> postIds = postsPage.getContent().stream().map(Post::getId).collect(Collectors.toList());
        List<Long> likedPostIds = postLikeRepository.findLikedPostIdsByUserIdAndPostIds(userId, postIds);

        return postsPage.map(post -> PostResponse.from(
            post,
            likedPostIds.contains(post.getId()),
            post.getAuthor() != null && post.getAuthor().getId().equals(userId),
            post.getAuthor() != null && post.getAuthor().getId().equals(userId)
        ));
    }

    /**
     * 게시글 상세 조회
     * - 클럽 멤버는 자유롭게 조회
     * - 비멤버라도 external_request로 연결된 문의 스레드(요청자)면 조회 가능
     */
    public PostResponse getPost(Long clubId, Long postId, Long userId) {
        validateThreadAccess(clubId, postId, userId);

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        boolean liked = false;
        // 비멤버 requester 케이스에서는 좋아요 기능을 우선 비활성(항상 false)
        if (clubMemberRepository.findByClubIdAndUserId(clubId, userId).isPresent()) {
            liked = postLikeRepository.findByPostIdAndUserId(postId, userId).isPresent();
        }

        boolean canEdit = post.getAuthor() != null && post.getAuthor().getId().equals(userId);
        boolean canDelete = canEdit;
        return PostResponse.from(post, liked, canEdit, canDelete);
    }

    /**
     * 게시글 생성
     */
    @Transactional
    public PostResponse createPost(Long clubId, PostRequest request, Long userId) {
        validateClubMember(clubId, userId);

        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("클럽을 찾을 수 없습니다."));

        User user = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
            .map(ClubMember::getUser)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Post post = new Post(club, user, request.getPostType(), request.getContent());
        Post savedPost = postRepository.save(post);

        return PostResponse.from(savedPost, false, true, true);
    }

    /**
     * 게시글 수정
     */
    @Transactional
    public PostResponse updatePost(Long clubId, Long postId, PostRequest request, Long userId) {
        validateClubMember(clubId, userId);

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (post.getAuthor() == null || !post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("게시글 작성자만 수정할 수 있습니다.");
        }

        post.update(request.getContent());

        return PostResponse.from(post, false, true, true);
    }

    /**
     * 게시글 삭제
     */
    @Transactional
    public void deletePost(Long clubId, Long postId, Long userId) {
        validateClubMember(clubId, userId);

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (post.getAuthor() == null || !post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("게시글 작성자만 삭제할 수 있습니다.");
        }

        post.softDelete();
    }

    /**
     * 게시글 좋아요 토글
     */
    @Transactional
    public LikeResponse toggleLike(Long clubId, Long postId, Long userId) {
        validateClubMember(clubId, userId);

        Post post = postRepository.findByIdAndClubIdAndNotDeleted(postId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        User user = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
            .map(ClubMember::getUser)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Optional<PostLike> likeOpt = postLikeRepository.findByPostIdAndUserId(postId, userId);

        if (likeOpt.isPresent()) {
            // 좋아요 취소
            postLikeRepository.delete(likeOpt.get());
            post.decrementLikeCount();
            return LikeResponse.of(false, post.getLikeCount());
        } else {
            // 좋아요 추가
            PostLike like = new PostLike(post, user);
            postLikeRepository.save(like);
            post.incrementLikeCount();
            return LikeResponse.of(true, post.getLikeCount());
        }
    }
}
