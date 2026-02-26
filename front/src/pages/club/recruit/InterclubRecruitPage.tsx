import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { scheduleService } from "../../../services/scheduleService";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { clubService, type ExternalRequestResponse } from "../../../services/clubService";
import { postService } from "../../../services/postService";
import { commentService } from "../../../services/commentService";
import type { Schedule } from "../../../types/schedule";
import type { Post, Comment } from "../../../types/post";
import { ArrowLeftIcon, CopyIcon } from "../../../components/common/Icons";
import { useToast } from "../../../contexts/ToastContext";
import { getOpenRunSession } from "../../../utils/openrunSession";

const InterclubRecruitPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { clubId, scheduleId } = useParams<{ clubId: string; scheduleId: string }>();

  const cid = clubId ? Number(clubId) : NaN;
  const sid = scheduleId ? Number(scheduleId) : NaN;

  const currentUserId = useMemo(() => {
    const session = getOpenRunSession();
    const raw = session.userId?.toString();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [myReq, setMyReq] = useState<ExternalRequestResponse | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiryContent, setInquiryContent] = useState("");
  const [commentContent, setCommentContent] = useState("");

  const isApplied = myReq?.status === "PENDING" || myReq?.status === "APPROVED";

  const statusLabel = useMemo(() => {
    if (!myReq) return "미신청";
    if (myReq.status === "PENDING") return "신청완료 (대기중)";
    if (myReq.status === "APPROVED") return "승인됨";
    if (myReq.status === "REJECTED") return "반려됨";
    if (myReq.status === "CANCELLED") return "신청취소";
    return myReq.status;
  }, [myReq]);

  const statusTone = useMemo(() => {
    if (!myReq) return "neutral";
    if (myReq.status === "PENDING") return "pending";
    if (myReq.status === "APPROVED") return "success";
    if (myReq.status === "REJECTED") return "danger";
    if (myReq.status === "CANCELLED") return "neutral";
    return "neutral";
  }, [myReq]);

  const statusToneClass = {
    neutral: "text-muted-foreground",
    pending: "text-[#b26b00]",
    success: "text-[#0a6b0a]",
    danger: "text-[#b00020]",
  }[statusTone];

  const sanitizeInquiryText = (text: string) => {
    // 혹시 과거 데이터로 URL이 들어간 케이스가 있으면 제거
    return text
      .replace(/^\[교류전 모집\]\s*\(바로가기:.*\)\s*\n?/m, "[교류전 모집]\n")
      .trim();
  };

  const handleCopyLink = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었습니다", "success");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("링크가 복사되었습니다", "success");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const load = async () => {
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scheduleData = await scheduleService.getScheduleById(sid);
      setSchedule(scheduleData);

      if (currentUserId) {
        try {
          const req = await clubService.getMyInterclubRecruitRequest(cid, sid);
          setMyReq(req);
          if (req.postId) {
            const p = await postService.getPost(cid, req.postId);
            setPost(p);
            const cs = await commentService.getComments(cid, req.postId);
            setComments(cs);
          } else {
            setPost(null);
            setComments([]);
          }
        } catch {
          setMyReq(null);
          setPost(null);
          setComments([]);
        }
      }
    } catch (e) {
      console.error(e);
      setError("교류전 모집 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, sid]);

  const requireLogin = () => {
    if (currentUserId) return false;
    if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
      sessionStorage.setItem("returnUrl", location.pathname);
      navigate("/login");
    }
    return true;
  };

  const handleApply = async () => {
    if (requireLogin()) return;
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    try {
      setActionLoading(true);
      const req = await clubService.applyInterclubRecruit(cid, sid);
      setMyReq(req);
      showToast("신청이 완료되었습니다", "success");
    } catch (e) {
      console.error(e);
      showToast("신청에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (requireLogin()) return;
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    if (!confirm("신청을 취소할까요?")) return;
    try {
      setActionLoading(true);
      const req = await clubService.cancelInterclubRecruit(cid, sid);
      setMyReq(req);
    } catch (e) {
      console.error(e);
      showToast("취소에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInquiry = async () => {
    if (requireLogin()) return;
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    if (!inquiryContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await clubService.createInterclubRecruitInquiry(cid, sid, inquiryContent.trim());
      setPost(created);
      setInquiryContent("");
      const cs = await commentService.getComments(cid, created.id);
      setComments(cs);
      showToast("문의글이 등록되었습니다", "success");
    } catch (e) {
      console.error(e);
      showToast("문의글 등록에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (requireLogin()) return;
    if (!Number.isFinite(cid) || !post) return;
    if (!commentContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await commentService.createComment(cid, post.id, { content: commentContent.trim() });
      setComments((prev) => [...prev, created]);
      setCommentContent("");
    } catch (e) {
      console.error(e);
      showToast("댓글 작성에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="py-6 text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-border bg-background"
          onClick={handleBack}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="text-lg flex-1 font-medium">교류전 모집</span>
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-border bg-background active:translate-y-px"
          onClick={handleCopyLink}
          type="button"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <CopyIcon size={18} />
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {/* 일정 카드 */}
      {schedule && (
        <div className="border border-border rounded-2xl bg-background p-4 mb-4">
          <div className="flex justify-between gap-4 mb-2">
            <div className="text-muted-foreground text-sm">일정</div>
            <div className="font-bold">
              {formatScheduleDateTime(schedule.scheduledAt, schedule.durationMinutes)}
            </div>
          </div>
          <div className="flex justify-between gap-4 mb-2">
            <div className="text-muted-foreground text-sm">장소</div>
            <div className="font-bold">{schedule.courtName}</div>
          </div>
          <div className="flex justify-between gap-4 mb-2">
            <div className="text-muted-foreground text-sm">비용</div>
            <div className="font-bold">{schedule.cost ?? "-"}</div>
          </div>
          <div className="flex justify-between gap-4 mb-2">
            <div className="text-muted-foreground text-sm">현재/정원</div>
            <div className="font-bold">
              {schedule.currentParticipants}/{schedule.maxCapacity}
            </div>
          </div>
          {schedule.interclubRecruitNote && (
            <div className="mt-2 p-2 border border-border rounded-xl bg-muted">
              {schedule.interclubRecruitNote}
            </div>
          )}
        </div>
      )}

      {/* 신청 영역 */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <div className="text-muted-foreground text-sm">신청상태</div>
          <div className={`font-extrabold ${statusToneClass}`}>{statusLabel}</div>
        </div>
        <div className="flex gap-2">
          {!isApplied ? (
            <button
              className="w-full border-none rounded-xl py-3 font-extrabold bg-primary text-white"
              onClick={handleApply}
              disabled={actionLoading}
              type="button"
            >
              신청하기
            </button>
          ) : (
            <button
              className="w-full border-none rounded-xl py-3 font-extrabold bg-red-100 text-[#b00020]"
              onClick={handleCancel}
              disabled={actionLoading}
              type="button"
            >
              신청취소
            </button>
          )}
        </div>
      </div>

      {/* 문의하기 (문의글 없을 때) */}
      {!post && (
        <div className="mb-4">
          <div className="font-extrabold mb-2">문의하기</div>
          <textarea
            className="w-full border border-[#111] bg-white rounded-xl p-3 text-sm min-h-[88px] resize-y focus:outline-none focus:border-[#111]"
            placeholder={
              "연락 방법/질문/요청사항 등을 자유롭게 작성해주세요.\n\n(문의글은 신청 여부와 무관하게 남길 수 있어요. 운영진 답변은 댓글로 달립니다)"
            }
            value={inquiryContent}
            onChange={(e) => setInquiryContent(e.target.value)}
            disabled={actionLoading}
          />
          <button
            className="w-full border-none rounded-xl py-3 font-extrabold bg-primary text-white"
            onClick={handleCreateInquiry}
            disabled={actionLoading}
            type="button"
          >
            문의를 남기기
          </button>
        </div>
      )}

      {/* 대화 스레드 */}
      {post && (
        <div className="mb-4">
          <div className="font-extrabold mb-2">대화</div>
          <div className="flex flex-col gap-2">
            {/* 원본 게시글 */}
            <div className="border border-[#111] bg-white rounded-xl p-3">
              <div>{sanitizeInquiryText(post.content)}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                {post.author?.name ?? post.guestName ?? "익명"} · {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="flex flex-col gap-2">
              {comments.length === 0 ? (
                <div className="p-2 text-muted-foreground">아직 댓글이 없습니다.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="border border-[#111] bg-white rounded-xl p-3">
                    <div>{c.content}</div>
                    <div className="mt-1.5 text-sm text-muted-foreground">
                      {c.author?.name ?? "익명"} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 댓글 입력 */}
            <div className="flex flex-col gap-2.5">
              <textarea
                className="w-full border border-[#111] bg-white rounded-xl p-3 text-sm min-h-[88px] resize-y focus:outline-none focus:border-[#111]"
                placeholder="댓글을 입력하세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className="w-full border-none rounded-xl py-3 font-extrabold bg-primary text-white"
                onClick={handleCreateComment}
                disabled={actionLoading || !commentContent.trim()}
                type="button"
              >
                댓글 작성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterclubRecruitPage;
