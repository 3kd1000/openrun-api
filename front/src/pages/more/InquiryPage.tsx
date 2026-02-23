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
      <div className="p-6 min-h-[calc(100vh-140px)] box-border">
        <div className="max-w-[600px] mx-auto">
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-140px)] box-border max-md:p-4 max-[425px]:p-2">
      <div className="max-w-[600px] mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8 max-[425px]:mb-6">
          <button
            className="flex items-center gap-1 px-2 py-1 bg-transparent border border-border rounded-md text-muted-foreground cursor-pointer text-sm transition-all hover:bg-muted hover:border-primary hover:text-primary"
            onClick={() => navigate("/more")}
          >
            <ArrowLeftIcon size={20} />
            <span className="max-[360px]:hidden">뒤로</span>
          </button>
          <span className="text-2xl font-bold text-foreground max-md:text-xl max-[425px]:text-lg max-[360px]:text-base">문의하기</span>
        </div>

        {/* 문의 작성 폼 */}
        {showForm && (
          <div className="bg-background border border-border rounded-lg p-6 mb-6 max-md:p-4 max-[425px]:p-2">
            <textarea
              className="w-full p-4 border border-border rounded-md text-base font-[inherit] resize-y min-h-[120px] box-border focus:outline-none focus:border-primary max-[425px]:text-sm max-[425px]:min-h-[100px] max-[360px]:text-sm max-[360px]:min-h-[80px] max-[360px]:p-2"
              placeholder="문의 내용을 입력해주세요 (최대 500자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={5}
            />
            <div className="flex justify-end mt-1">
              <span className="text-sm text-muted-foreground">
                {content.length}/500
              </span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {inquiries.length > 0 && (
                <button
                  className="px-4 py-2 bg-muted border border-border rounded-md text-muted-foreground text-base font-medium cursor-pointer transition-all hover:bg-muted/80 disabled:opacity-50 max-[360px]:text-sm max-[360px]:px-2"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  취소
                </button>
              )}
              <button
                className="px-6 py-2 bg-primary border-none rounded-md text-white text-base font-semibold cursor-pointer transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed max-[360px]:text-sm max-[360px]:px-2"
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
            className="flex items-center justify-center gap-2 w-full p-4 bg-primary border-none rounded-md text-white text-base font-semibold cursor-pointer transition-all mb-6 hover:bg-primary/90 hover:-translate-y-px hover:shadow-sm"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon size={18} />
            <span>새 문의 작성</span>
          </button>
        )}

        {/* 문의 목록 */}
        {inquiries.length > 0 && (
          <div className="flex flex-col gap-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`bg-background border rounded-lg overflow-hidden transition-all ${
                  expandedId === inquiry.id
                    ? "border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleExpandToggle(inquiry.id)}
                >
                  <div className="text-base text-foreground leading-relaxed mb-2 max-[425px]:text-sm max-[360px]:text-sm">
                    {inquiry.content.length > 80
                      ? inquiry.content.substring(0, 80) + "..."
                      : inquiry.content}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(inquiry.createdAt), "yyyy.M.d HH:mm")}
                    </span>
                    {inquiry.commentCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-white rounded-xl text-sm font-semibold">
                        <MessageCircleIcon size={14} />
                        <span>{inquiry.commentCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 확장된 스레드 */}
                {expandedId === inquiry.id && (
                  <div className="border-t border-border p-4 bg-muted">
                    {/* 원본 문의 전문 */}
                    <div className="bg-background rounded-md p-4 mb-4">
                      <div className="text-sm font-semibold text-primary mb-1">내 문의</div>
                      <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap max-[360px]:text-sm">
                        {inquiry.content}
                      </div>
                    </div>

                    {/* 댓글 (운영팀 답변) */}
                    <div className="mb-4">
                      {loadingComments[inquiry.id] ? (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                          댓글 로딩 중...
                        </div>
                      ) : (commentsByPostId[inquiry.id] || []).length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                          아직 답변이 없습니다.
                        </div>
                      ) : (
                        (commentsByPostId[inquiry.id] || []).map((comment) => (
                          <div key={comment.id} className="bg-background rounded-md p-4 mb-2 last:mb-0">
                            <div className="text-sm font-semibold text-muted-foreground mb-1">
                              {comment.author?.name || "운영팀"}
                            </div>
                            <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap max-[360px]:text-sm">
                              {comment.content}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
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
                    <div className="flex gap-2 items-end max-[425px]:flex-col max-[425px]:items-stretch max-[360px]:flex-col max-[360px]:items-stretch">
                      <textarea
                        className="flex-1 p-2 border border-border rounded-md text-base font-[inherit] resize-none min-h-[60px] focus:outline-none focus:border-primary"
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
                        className="px-4 py-2 bg-primary border-none rounded-md text-white text-base font-semibold cursor-pointer transition-all whitespace-nowrap hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed max-[425px]:w-full max-[360px]:w-full"
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
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">문의 내역이 없습니다.</p>
            <button
              className="px-6 py-2 bg-primary border-none rounded-md text-white text-base font-semibold cursor-pointer transition-all hover:bg-primary/90"
              onClick={() => setShowForm(true)}
            >
              첫 문의 작성하기
            </button>
          </div>
        )}

        {/* 안내 문구 */}
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <span className="block text-lg font-semibold text-foreground mb-2 max-[360px]:text-base">문의 안내</span>
          <p className="text-sm text-muted-foreground my-1 leading-relaxed">서비스 이용 중 궁금한 점이나 개선 요청사항을 남겨주세요.</p>
          <p className="text-sm text-muted-foreground my-1 leading-relaxed">운영팀이 확인 후 답변을 드립니다.</p>
        </div>
      </div>
    </div>
  );
};

export default InquiryPage;
