import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { postService } from "../../services/postService";
import { commentService } from "../../services/commentService";
import { PostType, type Post, type Comment, type PostType as PostTypeT } from "../../types/post";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import { CategoryTabs } from "./components/CategoryTabs";
import { PostCard } from "./components/PostCard";
import QuickPostInput from "./components/QuickPostInput";
import { canManageClub, normalizeClubRole } from "../../utils/role";
import { getOpenRunSession } from "../../utils/openrunSession";
import "./PostListPage.css";

const PostListPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [searchParams] = useSearchParams();

  const myRole = normalizeClubRole(
    getOpenRunSession().currentClubRole ?? localStorage.getItem("current_club_role")
  );
  const canManage = canManageClub(myRole);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  // 정회원/준회원은 "자유(GENERAL)"만: 탭 미노출 + 필터 고정 (초기부터 GENERAL로)
  const [selectedPostType, setSelectedPostType] = useState<PostTypeT | null>(() =>
    canManage ? null : PostType.GENERAL
  );
  const [expandedPostIds, setExpandedPostIds] = useState<Set<number>>(new Set());
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetPostId = useMemo(() => {
    const raw = searchParams.get("postId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  // 정회원/준회원은 "자유(GENERAL)"만: 탭 미노출 + 필터 고정
  useEffect(() => {
    if (!canManage) setSelectedPostType(PostType.GENERAL);
  }, [canManage]);

  useEffect(() => {
    if (clubId) {
      loadPosts();
    }
  }, [clubId, selectedPostType]);

  const loadPosts = async () => {
    if (!clubId) return;

    try {
      setIsLoadingPosts(true);
      setError(null);
      const data = await postService.getPosts(
        Number(clubId),
        selectedPostType || undefined
      );
      // 공지사항은 게시판(Post)에서 제거: 항상 숨김 처리
      // 정회원/준회원은 문의(INQUIRY)도 숨김 처리 (서버가 전체를 내려줘도 안전하게 방어)
      const visible = data.content.filter((p) => {
        if (p.postType === PostType.NOTICE) return false;
        if (!canManage && p.postType !== PostType.GENERAL) return false;
        return true;
      });
      setPosts(visible);
    } catch (error: unknown) {
      logError("게시글 조회", error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // 외부요청 -> 문의글 보기(postId)로 들어온 경우, 해당 글 자동 펼치기
  useEffect(() => {
    if (!clubId) return;
    // 정회원/준회원은 postId 딥링크(문의글) 자체를 볼 일이 없음
    if (!canManage) return;
    if (!targetPostId) return;
    if (isLoadingPosts) return;

    const openTarget = async () => {
      // 1) 목록에 있으면 펼치기
      const found = posts.find((p) => p.id === targetPostId);
      if (found) {
        setExpandedPostIds((prev) => new Set(prev).add(targetPostId));
        if (!comments[targetPostId]) {
          await loadComments(targetPostId);
        }
        return;
      }

      // 2) 목록에 없으면 개별 조회 후 상단에 삽입
      try {
        const fetched = await postService.getPost(Number(clubId), targetPostId);
        if (fetched.postType === PostType.NOTICE) return;
        setPosts((prev) => {
          if (prev.some((p) => p.id === fetched.id)) return prev;
          return [fetched, ...prev];
        });
        setExpandedPostIds((prev) => new Set(prev).add(targetPostId));
        await loadComments(targetPostId);
      } catch (e) {
        // 실패는 조용히 무시 (권한/삭제 등)
      }
    };

    void openTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, canManage, targetPostId, isLoadingPosts, posts.length]);

  const loadComments = async (postId: number) => {
    if (!clubId) return;

    try {
      const data = await commentService.getComments(Number(clubId), postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (error: unknown) {
      logError("댓글 조회", error);
    }
  };

  const handleTogglePost = (postId: number) => {
    setExpandedPostIds((prev) => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(postId);

      if (isExpanding) {
        newSet.add(postId);
        if (!comments[postId]) {
          loadComments(postId);
        }
      } else {
        newSet.delete(postId);
      }

      return newSet;
    });
  };

  const handleLikePost = async (postId: number) => {
    if (!clubId) return;

    try {
      const result = await postService.toggleLike(Number(clubId), postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, liked: result.liked, likeCount: result.likeCount }
            : post
        )
      );
    } catch (error: unknown) {
      logError("좋아요", error);
      alert(getErrorMessage(error));
    }
  };

  const handleLikeComment = async (postId: number, commentId: number) => {
    if (!clubId) return;

    try {
      const result = await commentService.toggleLike(
        Number(clubId),
        postId,
        commentId
      );
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].map((comment) =>
          comment.id === commentId
            ? { ...comment, liked: result.liked, likeCount: result.likeCount }
            : comment
        ),
      }));
    } catch (error: unknown) {
      logError("댓글 좋아요", error);
    }
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!clubId) return;

    try {
      const newComment = await commentService.createComment(
        Number(clubId),
        postId,
        { content }
      );
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
    } catch (error: unknown) {
      logError("댓글 작성", error);
      throw error;
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!clubId) return;

    try {
      await commentService.deleteComment(Number(clubId), postId, commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        )
      );
    } catch (error: unknown) {
      logError("댓글 삭제", error);
      alert(getErrorMessage(error));
    }
  };

  const handleCreatePost = async (content: string) => {
    if (!clubId) return;

    try {
      // 클럽 내부 글쓰기는 "자유(GENERAL)"만 지원
      await postService.createPost(Number(clubId), { content, postType: PostType.GENERAL });
      await loadPosts();
    } catch (error: unknown) {
      logError("게시글 작성", error);
      throw error;
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!clubId) return;

    try {
      await postService.deletePost(Number(clubId), postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setExpandedPostIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } catch (error: unknown) {
      logError("게시글 삭제", error);
      alert(getErrorMessage(error));
    }
  };

  const handlePostTypeChange = (postType: PostTypeT | null) => {
    setSelectedPostType(postType);
    setExpandedPostIds(new Set());
  };

  if (!clubId) {
    return (
      <div className="post-list-page">
        <div className="post-list-page__empty">
          <p className="post-list-page__empty-icon">👥</p>
          <p className="post-list-page__empty-message">클럽을 선택해주세요.</p>
          <button
            className="post-list-page__empty-button"
            onClick={() => navigate("/clubs/explore")}
          >
            클럽 홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-list-page">
      <div className="post-list-page__header">
        <button
          className="post-list-page__back-btn"
          onClick={() => navigate(`/clubs/${clubId}`)}
        >
          ← 뒤로
        </button>
        <h1 className="post-list-page__title">게시판</h1>
      </div>

      {/* 게시글 타입 탭 */}
      {canManage && (
        <CategoryTabs
          selectedPostType={selectedPostType}
          onSelectPostType={handlePostTypeChange}
          allowedPostTypes={[PostType.GENERAL, PostType.INQUIRY]}
          showAllTab
        />
      )}

      {/* 게시글 목록 */}
      <div className="post-list-page__posts">
        {isLoadingPosts && (
          <div className="post-list-page__posts-loading">
            게시글을 불러오는 중...
          </div>
        )}

        {error && <div className="post-list-page__posts-error">{error}</div>}

        {!isLoadingPosts && !error && posts.length === 0 && (
          <div className="post-list-page__posts-empty">
            <p className="post-list-page__posts-empty-icon">📝</p>
            <p className="post-list-page__posts-empty-message">
              {selectedPostType
                ? "해당 카테고리에 게시글이 없습니다."
                : "아직 작성된 글이 없습니다."}
            </p>
            <p className="post-list-page__posts-empty-hint">
              첫 글을 작성해보세요!
            </p>
          </div>
        )}

        {!isLoadingPosts &&
          !error &&
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={comments[post.id] || []}
              isExpanded={expandedPostIds.has(post.id)}
              onToggleExpand={handleTogglePost}
              onLikePost={handleLikePost}
              onLikeComment={handleLikeComment}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onDeletePost={handleDeletePost}
            />
          ))}
      </div>

      {/* 빠른 글쓰기 입력 */}
      <QuickPostInput onSubmit={handleCreatePost} />
    </div>
  );
};

export default PostListPage;
