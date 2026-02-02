import { useState, useEffect, useCallback } from "react";
import {
  getAllInquiries,
  getInquiryComments,
  addComment,
} from "../services/inquiryService";
import type { InquiryResponse, CommentResponse } from "../services/inquiryService";
import { formatShortDateTime } from "../utils/dateUtils";
import "./InquiryManagePage.css";

function InquiryManagePage() {
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 선택된 문의 (확장)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // 답변 입력
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllInquiries();
      setInquiries(response);
    } catch (err) {
      setError("문의 목록을 불러오는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleRowClick = async (inquiry: InquiryResponse) => {
    if (expandedId === inquiry.id) {
      setExpandedId(null);
      setComments([]);
      return;
    }

    setExpandedId(inquiry.id);
    setLoadingComments(true);
    try {
      const response = await getInquiryComments(inquiry.id);
      setComments(response);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!expandedId || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await addComment(expandedId, replyContent.trim());
      setComments((prev) => [...prev, newComment]);
      setReplyContent("");

      // 댓글 카운트 업데이트
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === expandedId
            ? { ...inq, commentCount: inq.commentCount + 1 }
            : inq
        )
      );
    } catch (err) {
      console.error("답변 작성 실패:", err);
      alert("답변 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inquiry-manage-page">
      <h2>문의 관리</h2>
      <p className="inquiry-manage-page__description">
        사용자가 접수한 서비스 문의를 확인하고 답변합니다.
      </p>

      {error && <div className="inquiry-manage-page__error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : inquiries.length === 0 ? (
        <div className="inquiry-manage-page__empty">
          <p>접수된 문의가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="inquiry-manage-page__info">
            총 {inquiries.length}건
          </div>
          <div className="inquiry-manage-page__list">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`inquiry-card ${
                  expandedId === inquiry.id ? "is-expanded" : ""
                }`}
              >
                <div
                  className="inquiry-card__header"
                  onClick={() => handleRowClick(inquiry)}
                >
                  <div className="inquiry-card__main">
                    <div className="inquiry-card__author">
                      {inquiry.author?.name || "알 수 없음"}
                    </div>
                    <div className="inquiry-card__content">
                      {inquiry.content.length > 100
                        ? inquiry.content.substring(0, 100) + "..."
                        : inquiry.content}
                    </div>
                  </div>
                  <div className="inquiry-card__meta">
                    <span className="inquiry-card__date">
                      {formatShortDateTime(inquiry.createdAt)}
                    </span>
                    {inquiry.commentCount > 0 ? (
                      <span className="inquiry-card__badge inquiry-card__badge--replied">
                        답변 {inquiry.commentCount}
                      </span>
                    ) : (
                      <span className="inquiry-card__badge inquiry-card__badge--pending">
                        대기중
                      </span>
                    )}
                  </div>
                </div>

                {/* 확장 영역 */}
                {expandedId === inquiry.id && (
                  <div className="inquiry-card__detail">
                    {/* 원본 문의 */}
                    <div className="inquiry-card__original">
                      <div className="inquiry-card__original-label">문의 내용</div>
                      <div className="inquiry-card__original-content">
                        {inquiry.content}
                      </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="inquiry-card__comments">
                      <div className="inquiry-card__comments-label">답변 내역</div>
                      {loadingComments ? (
                        <p className="inquiry-card__comments-loading">로딩 중...</p>
                      ) : comments.length === 0 ? (
                        <p className="inquiry-card__comments-empty">
                          아직 답변이 없습니다.
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="inquiry-comment">
                            <div className="inquiry-comment__header">
                              <span className="inquiry-comment__author">
                                {comment.author?.name || "운영팀"}
                              </span>
                              <span className="inquiry-comment__date">
                                {formatShortDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <div className="inquiry-comment__content">
                              {comment.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 답변 입력 */}
                    <div className="inquiry-card__reply">
                      <textarea
                        className="inquiry-card__reply-input"
                        placeholder="답변을 입력하세요..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                      />
                      <button
                        className="btn-primary"
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || submitting}
                      >
                        {submitting ? "전송 중..." : "답변 전송"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default InquiryManagePage;
