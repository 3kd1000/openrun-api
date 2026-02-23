import { useState, useEffect, useCallback } from "react";
import {
  getAllInquiries,
  getInquiryComments,
  addComment,
} from "../services/inquiryService";
import type { InquiryResponse, CommentResponse } from "../services/inquiryService";
import { formatShortDateTime } from "../utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">문의 관리</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          사용자가 접수한 서비스 문의를 확인하고 답변합니다.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground text-sm">접수된 문의가 없습니다.</p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">총 {inquiries.length}건</p>
          <div className="flex flex-col gap-3">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border rounded-lg overflow-hidden bg-card transition-colors hover:border-primary"
              >
                {/* 카드 헤더 (클릭 가능) */}
                <button
                  className="w-full p-4 flex justify-between items-start gap-4 text-left"
                  onClick={() => handleRowClick(inquiry)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">
                      {inquiry.author?.name || "알 수 없음"}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {inquiry.content.length > 100
                        ? inquiry.content.substring(0, 100) + "..."
                        : inquiry.content}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatShortDateTime(inquiry.createdAt)}
                    </span>
                    {inquiry.commentCount > 0 ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        답변 {inquiry.commentCount}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">대기중</Badge>
                    )}
                  </div>
                </button>

                {/* 확장 영역 */}
                {expandedId === inquiry.id && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    {/* 원본 문의 */}
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">문의 내용</p>
                      <div className="bg-background rounded-md p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {inquiry.content}
                        </p>
                      </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">답변 내역</p>
                      {loadingComments ? (
                        <p className="text-sm text-muted-foreground text-center py-3">로딩 중...</p>
                      ) : comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          아직 답변이 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-background rounded-md p-4">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {comment.author?.name || "운영팀"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatShortDateTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm leading-snug whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 답변 입력 */}
                    <div className="flex flex-col gap-2">
                      <Textarea
                        rows={3}
                        className="w-full"
                        placeholder="답변을 입력하세요..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || submitting}
                      >
                        {submitting ? "전송 중..." : "답변 전송"}
                      </Button>
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
