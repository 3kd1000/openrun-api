import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { inquiryService } from "../../services/inquiryService";
import {
  ArrowLeftIcon,
  PlusIcon,
  MessageCircleIcon,
} from "../../components/common/Icons";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { Post, Comment } from "../../types/post";
import "./InquiryPage.css";

const InquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthReady, user } = useAuth();

  const [inquiries, setInquiries] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 확장된 문의 ID (스레드 표시용)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<number, Comment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isAuthReady && user) {
      loadInquiries();
    } else if (isAuthReady && !user) {
      navigate("/login");
    }
  }, [isAuthReady, user, navigate]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await inquiryService.getMyInquiries();
      setInquiries(data);

      // 문의가 없으면 바로 작성 폼 표시
      if (data.length === 0) {
        setShowForm(true);
      }
    } catch (error) {
      console.error("문의 목록 조회 실패:", error);
      showToast("문의 목록을 불러오지 못했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await inquiryService.createInquiry(content.trim());
      setContent("");
      setShowForm(false);
      await loadInquiries();
      showToast("문의가 접수되었습니다", "success");
    } catch (error) {
      console.error("문의 작성 실패:", error);
      showToast("문의 작성에 실패했습니다", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpandToggle = async (postId: number) => {
    if (expandedId === postId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(postId);

    // 댓글 로드
    if (!commentsByPostId[postId]) {
      try {
        setLoadingComments((prev) => ({ ...prev, [postId]: true }));
        const comments = await inquiryService.getInquiryComments(postId);
        setCommentsByPostId((prev) => ({ ...prev, [postId]: comments }));
      } catch (error) {
        console.error("댓글 조회 실패:", error);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const draft = commentDraft[postId]?.trim();
    if (!draft) return;

    try {
      const newComment = await inquiryService.addComment(postId, draft);
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));

      // 댓글 카운트 업데이트
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === postId
            ? { ...inq, commentCount: inq.commentCount + 1 }
            : inq
        )
      );
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      showToast("댓글 작성에 실패했습니다", "error");
    }
  };

  // 로딩 중
  if (!isAuthReady || loading) {
    return (
      <div className="inquiry-page">
        <div className="inquiry-page__content">
          <div className="inquiry-page__loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-page">
      <div className="inquiry-page__content">
        {/* 헤더 */}
        <div className="inquiry-page__header">
          <button
            className="inquiry-page__back-btn"
            onClick={() => navigate("/more")}
          >
            <ArrowLeftIcon size={20} />
            <span>뒤로</span>
          </button>
          <h1>문의하기</h1>
        </div>

        {/* 문의 작성 폼 */}
        {showForm && (
          <div className="inquiry-page__form">
            <textarea
              className="inquiry-page__textarea"
              placeholder="문의 내용을 입력해주세요 (최대 500자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={5}
            />
            <div className="inquiry-page__form-meta">
              <span className="inquiry-page__char-count">
                {content.length}/500
              </span>
            </div>
            <div className="inquiry-page__form-actions">
              {inquiries.length > 0 && (
                <button
                  className="inquiry-page__btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  취소
                </button>
              )}
              <button
                className="inquiry-page__btn-submit"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
              >
                {submitting ? "작성 중..." : "문의 접수"}
              </button>
            </div>
          </div>
        )}

        {/* 새 문의 작성 버튼 */}
        {inquiries.length > 0 && !showForm && (
          <button
            className="inquiry-page__new-btn"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon size={18} />
            <span>새 문의 작성</span>
          </button>
        )}

        {/* 문의 목록 */}
        {inquiries.length > 0 && (
          <div className="inquiry-page__list">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`inquiry-page__card ${
                  expandedId === inquiry.id ? "is-expanded" : ""
                }`}
              >
                <div
                  className="inquiry-page__card-header"
                  onClick={() => handleExpandToggle(inquiry.id)}
                >
                  <div className="inquiry-page__card-content">
                    {inquiry.content.length > 80
                      ? inquiry.content.substring(0, 80) + "..."
                      : inquiry.content}
                  </div>
                  <div className="inquiry-page__card-meta">
                    <span className="inquiry-page__card-date">
                      {format(new Date(inquiry.createdAt), "yyyy.M.d HH:mm")}
                    </span>
                    {inquiry.commentCount > 0 && (
                      <span className="inquiry-page__comment-badge">
                        <MessageCircleIcon size={14} />
                        <span>{inquiry.commentCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 확장된 스레드 */}
                {expandedId === inquiry.id && (
                  <div className="inquiry-page__thread">
                    {/* 원본 문의 전문 */}
                    <div className="inquiry-page__original">
                      <div className="inquiry-page__original-label">내 문의</div>
                      <div className="inquiry-page__original-content">
                        {inquiry.content}
                      </div>
                    </div>

                    {/* 댓글 (운영팀 답변) */}
                    <div className="inquiry-page__comments">
                      {loadingComments[inquiry.id] ? (
                        <div className="inquiry-page__comments-loading">
                          댓글 로딩 중...
                        </div>
                      ) : (commentsByPostId[inquiry.id] || []).length === 0 ? (
                        <div className="inquiry-page__no-reply">
                          아직 답변이 없습니다.
                        </div>
                      ) : (
                        (commentsByPostId[inquiry.id] || []).map((comment) => (
                          <div key={comment.id} className="inquiry-page__comment">
                            <div className="inquiry-page__comment-author">
                              {comment.author?.name || "운영팀"}
                            </div>
                            <div className="inquiry-page__comment-content">
                              {comment.content}
                            </div>
                            <div className="inquiry-page__comment-date">
                              {format(
                                new Date(comment.createdAt),
                                "yyyy.M.d HH:mm"
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 추가 문의 입력 */}
                    <div className="inquiry-page__add-comment">
                      <textarea
                        className="inquiry-page__comment-input"
                        placeholder="추가 문의사항을 입력하세요"
                        value={commentDraft[inquiry.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({
                            ...prev,
                            [inquiry.id]: e.target.value,
                          }))
                        }
                        rows={2}
                      />
                      <button
                        className="inquiry-page__btn-comment"
                        onClick={() => handleAddComment(inquiry.id)}
                        disabled={!commentDraft[inquiry.id]?.trim()}
                      >
                        전송
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 안내 */}
        {inquiries.length === 0 && !showForm && (
          <div className="inquiry-page__empty">
            <p>문의 내역이 없습니다.</p>
            <button onClick={() => setShowForm(true)}>첫 문의 작성하기</button>
          </div>
        )}

        {/* 안내 문구 */}
        <div className="inquiry-page__notice">
          <h2>문의 안내</h2>
          <p>서비스 이용 중 궁금한 점이나 개선 요청사항을 남겨주세요.</p>
          <p>운영팀이 확인 후 답변을 드립니다.</p>
        </div>
      </div>
    </div>
  );
};

export default InquiryPage;
