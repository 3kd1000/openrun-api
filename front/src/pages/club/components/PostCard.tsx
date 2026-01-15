import React, { useState } from 'react';
import type { Post, Comment, PostType } from '../../../types/post';
import { HeartIcon, MessageCircleIcon, Trash2Icon } from '../../../components/common/Icons';
import { getErrorMessage, logError } from '../../../utils/errorHandler';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  comments: Comment[];
  isExpanded: boolean;
  onToggleExpand: (postId: number) => void;
  onLikePost: (postId: number) => void;
  onLikeComment: (postId: number, commentId: number) => void;
  onAddComment: (postId: number, content: string) => Promise<void>;
  onDeleteComment: (postId: number, commentId: number) => void;
  onDeletePost: (postId: number) => void;
}

const POST_TYPE_LABELS: Record<PostType, string> = {
  NOTICE: '공지사항',
  GENERAL: '자유',
  INQUIRY: '문의'
};

const POST_TYPE_COLORS: Record<PostType, string> = {
  NOTICE: 'post-card__category-badge--notice',
  GENERAL: 'post-card__category-badge--free',
  INQUIRY: 'post-card__category-badge--question'
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  comments,
  isExpanded,
  onToggleExpand,
  onLikePost,
  onLikeComment,
  onAddComment,
  onDeleteComment,
  onDeletePost
}) => {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleToggle = () => {
    onToggleExpand(post.id);
  };

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikePost(post.id);
  };

  const handleLikeComment = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    onLikeComment(post.id, commentId);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmittingComment(true);
      await onAddComment(post.id, commentContent.trim());
      setCommentContent('');
    } catch (error: unknown) {
      logError('댓글 작성', error);
      alert(getErrorMessage(error));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      onDeleteComment(post.id, commentId);
    }
  };

  const handleDeletePost = () => {
    if (confirm('게시글을 삭제하시겠습니까?')) {
      onDeletePost(post.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      // 오늘이면 시간만 표시
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    // 오늘이 아니면 날짜 + 시간 표시
    return date.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card__header">
        <div className="post-card__author">
          {post.author.imageUrl && (
            <img
              src={post.author.imageUrl}
              alt={post.author.name}
              className="post-card__author-avatar"
            />
          )}
          <div className="post-card__author-info">
            <div className="post-card__author-line">
              <span className="post-card__author-name">{post.author.name}</span>
              <span className="post-card__date-separator">·</span>
              <span className="post-card__date">{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <span className={`post-card__category-badge ${POST_TYPE_COLORS[post.postType]}`}>
          {POST_TYPE_LABELS[post.postType]}
        </span>
      </div>

      {/* Content (clickable to expand) */}
      <div className="post-card__body" onClick={handleToggle}>
        <div className={`post-card__content ${!isExpanded ? 'post-card__content--collapsed' : ''}`}>
          <p className="post-card__text">{post.content}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="post-card__actions">
        <button
          className={`post-card__action-btn ${post.liked ? 'post-card__action-btn--active' : ''}`}
          onClick={handleLikePost}
        >
          <HeartIcon size={18} filled={post.liked} />
          <span>{post.likeCount}</span>
        </button>
        <button className="post-card__action-btn" onClick={handleToggle}>
          <MessageCircleIcon size={18} />
          <span>{post.commentCount}</span>
        </button>
        {post.canDelete && (
          <button className="post-card__action-btn post-card__action-btn--delete" onClick={handleDeletePost}>
            <Trash2Icon size={18} />
            <span>삭제</span>
          </button>
        )}
      </div>

      {/* Expanded Comments Section */}
      {isExpanded && (
        <div className="post-card__comments">
          <div className="post-card__comments-header">
            <h4 className="post-card__comments-title">댓글 {comments.length}</h4>
          </div>

          {/* Comment List */}
          <div className="post-card__comments-list">
            {comments.length === 0 ? (
              <p className="post-card__comments-empty">첫 댓글을 작성해보세요!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="post-card__comment">
                  {comment.author.imageUrl && (
                    <img
                      src={comment.author.imageUrl}
                      alt={comment.author.name}
                      className="post-card__comment-avatar"
                    />
                  )}
                  <div className="post-card__comment-body">
                    <div className="post-card__comment-header">
                      <span className="post-card__comment-author">{comment.author.name}</span>
                      <span className="post-card__comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="post-card__comment-text">{comment.content}</p>
                    <div className="post-card__comment-actions">
                      <button
                        className={`post-card__comment-action ${comment.liked ? 'post-card__comment-action--active' : ''}`}
                        onClick={(e) => handleLikeComment(e, comment.id)}
                      >
                        <HeartIcon size={14} filled={comment.liked} />
                        <span>{comment.likeCount}</span>
                      </button>
                      {comment.canDelete && (
                        <button
                          className="post-card__comment-action post-card__comment-action--delete"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2Icon size={14} />
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form className="post-card__comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              className="post-card__comment-input"
              placeholder="댓글을 입력하세요..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              className="post-card__comment-submit"
              disabled={isSubmittingComment || !commentContent.trim()}
            >
              {isSubmittingComment ? '작성 중...' : '작성'}
            </button>
          </form>

          {/* Collapse Button */}
          <button className="post-card__collapse-btn" onClick={handleToggle}>
            접기 ▲
          </button>
        </div>
      )}
    </article>
  );
};
