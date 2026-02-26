import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { scheduleService } from "../../../services/scheduleService";
import {
  clubService,
  type ExternalRequestResponse,
} from "../../../services/clubService";
import { postService } from "../../../services/postService";
import { commentService } from "../../../services/commentService";
import type { Schedule, MatchType } from "../../../types/schedule";
import type { Post, Comment } from "../../../types/post";
import {
  MapPinIcon,
  CalendarIcon,
} from "../../../components/common/Icons";
import { Link2, Users } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { Button } from "@/components/ui/button";
import { useToast } from "../../../contexts/ToastContext";
import { getOpenRunSession } from "../../../utils/openrunSession";

const getMatchTypeLabel = (matchType: MatchType | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES":
      return "남복";
    case "WOMEN_DOUBLES":
      return "여복";
    case "MIXED_DOUBLES":
      return "혼복";
    default:
      return "-";
  }
};

const GuestRecruitPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { clubId, scheduleId } = useParams<{
    clubId: string;
    scheduleId: string;
  }>();

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

  const sanitizeInquiryText = (text: string) => {
    return text
      .replace(/^\[게스트 모집\]\s*\(바로가기:.*\)\s*\n?/m, "[게스트 모집]\n")
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

  const statusLabel = useMemo(() => {
    if (!myReq) return "미신청";
    if (myReq.status === "PENDING") return "신청완료 (대기중)";
    if (myReq.status === "APPROVED") return "참가 확정";
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
    pending: "text-yellow-700",
    success: "text-green-700",
    danger: "text-red-700",
  }[statusTone];

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
          const req = await clubService.getMyGuestRecruitRequest(cid, sid);
          setMyReq(req);
          if (req.postId) {
            const p = await postService.getPost(cid, req.postId);
            setPost(p);
            const cs = await commentService.getComments(cid, req.postId);
            setComments(cs);
          }
        } catch {
          setMyReq(null);
          setPost(null);
          setComments([]);
        }
      }
    } catch (e) {
      console.error(e);
      setError("게스트 모집 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, sid]);

  const handleBack = () => {
    const state = location.state as { returnUrl?: string } | null;
    if (state?.returnUrl) {
      navigate(state.returnUrl);
    } else {
      navigate(-1);
    }
  };

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
      const req = await clubService.applyGuestRecruit(cid, sid);
      setMyReq(req);
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
    if (!confirm("신청을 취소하시겠습니까?")) return;
    try {
      setActionLoading(true);
      const req = await clubService.cancelGuestRecruit(cid, sid);
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
      const p = await clubService.createGuestRecruitInquiry(
        cid,
        sid,
        inquiryContent.trim()
      );
      setPost(p);
      const cs = await commentService.getComments(cid, p.id);
      setComments(cs);
      setInquiryContent("");
    } catch (e) {
      console.error(e);
      showToast("문의글 작성에 실패했습니다", "error");
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
      const created = await commentService.createComment(cid, post.id, {
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, created]);
      setCommentContent("");
    } catch (e) {
      console.error(e);
      showToast("댓글 작성에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const outlineBtnClass =
    "w-full border-[1.5px] border-primary rounded-xl py-3.5 text-base font-bold bg-transparent text-primary cursor-pointer transition-all hover:bg-primary/5 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:border-muted-foreground disabled:text-muted-foreground";

  if (loading) {
    return (
      <div className="page-container p-4">
        <div className="py-6 text-muted-foreground text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="relative flex items-center justify-between py-2 mb-3">
        <BackButton onClick={handleBack} />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-foreground pointer-events-none">
          게스트 모집
        </span>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleCopyLink}
        >
          <Link2 size={14} className="mr-1" />
          링크복사
        </Button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 히어로 카드 */}
      {schedule && (
        <div className="rounded-2xl overflow-hidden border border-border bg-white">
          {/* 에메랄드 배너 */}
          <div className="bg-primary px-6 pt-6 pb-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white leading-tight break-words flex-1 min-w-0">
                {schedule.clubName ?? "클럽"}
              </h2>
              <button
                type="button"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 text-sm text-white font-medium cursor-pointer transition-colors hover:bg-white/30 border-none"
                onClick={() =>
                  navigate(`/clubs/${cid}/recruiting`, {
                    state: { from: "guest-recruit" },
                  })
                }
              >
                클럽 보기 &gt;
              </button>
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {schedule.courtName && (
                <span className="inline-flex items-center gap-1 text-sm text-white/85">
                  <MapPinIcon size={14} color="currentColor" />
                  {schedule.courtName}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm text-white/85">
                <CalendarIcon size={14} color="currentColor" />
                {formatScheduleDateTime(
                  schedule.scheduledAt,
                  schedule.durationMinutes
                )}
              </span>
            </div>
          </div>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-3 border-b border-border">
            <div className="flex flex-col items-center py-4 border-r border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users size={14} />
                <span className="text-xs">현재/정원</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {schedule.currentParticipants}/{schedule.maxCapacity}명
              </span>
            </div>
            <div className="flex flex-col items-center py-4 border-r border-border">
              <span className="text-xs text-muted-foreground mb-1">비용</span>
              <span className="text-lg font-bold text-foreground">
                {schedule.cost != null
                  ? `${schedule.cost.toLocaleString()}원`
                  : "-"}
              </span>
            </div>
            {schedule.matchType && schedule.matchType !== "NONE" && (
              <div className="flex flex-col items-center py-4">
                <span className="text-xs text-muted-foreground mb-1">
                  모임타입
                </span>
                <span className="text-lg font-bold text-foreground">
                  {getMatchTypeLabel(schedule.matchType)}
                </span>
              </div>
            )}
            {(!schedule.matchType || schedule.matchType === "NONE") && (
              <div className="flex flex-col items-center py-4">
                <span className="text-xs text-muted-foreground mb-1">
                  모임타입
                </span>
                <span className="text-lg font-bold text-muted-foreground">
                  -
                </span>
              </div>
            )}
          </div>

          {/* 신청 상태 + CTA */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-sm text-muted-foreground">신청상태</span>
              <span
                className={`text-sm font-bold whitespace-nowrap ${statusToneClass}`}
              >
                {statusLabel}
              </span>
            </div>
            {!isApplied ? (
              <button
                className="w-full rounded-xl py-3.5 text-base font-bold bg-primary text-white cursor-pointer transition-all hover:bg-primary/90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApply}
                disabled={actionLoading}
                type="button"
              >
                신청하기
              </button>
            ) : (
              <button
                className="w-full rounded-xl py-3.5 text-base font-bold cursor-pointer transition-all border-[1.5px] border-red-500 bg-transparent text-red-600 hover:bg-red-50 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancel}
                disabled={actionLoading}
                type="button"
              >
                신청취소
              </button>
            )}
          </div>
        </div>
      )}

      {/* 모집 안내 */}
      {schedule?.guestRecruitNote && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className="text-sm font-bold text-primary mb-3">모집 안내</div>
          <div className="w-full p-4 bg-sky-50 border border-sky-200 rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {schedule.guestRecruitNote}
          </div>
        </div>
      )}

      {/* 문의하기 (문의글 없을 때) */}
      {!post && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className="text-sm font-bold mb-3">문의하기</div>
          <textarea
            className="w-full border-[1.5px] border-muted-foreground/30 bg-white rounded-xl p-3 text-sm font-[inherit] min-h-[96px] resize-y mb-3 transition-colors focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={
              "연락 방법/질문/요청사항 등을 자유롭게 작성해주세요.\n문의글은 신청 여부와 무관하게 남길 수 있어요."
            }
            value={inquiryContent}
            onChange={(e) => setInquiryContent(e.target.value)}
            disabled={actionLoading}
          />
          <button
            className={outlineBtnClass}
            onClick={handleCreateInquiry}
            disabled={actionLoading || !inquiryContent.trim()}
            type="button"
          >
            문의하기
          </button>
        </div>
      )}

      {/* 대화 스레드 */}
      {post && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className="text-sm font-bold mb-3">대화</div>
          <div className="flex flex-col gap-3">
            {/* 원본 게시글 */}
            <div className="border border-border bg-white rounded-xl p-3">
              <div className="text-sm whitespace-pre-wrap">
                {sanitizeInquiryText(post.content)}
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">
                {post.author?.name ?? post.guestName ?? "익명"} ·{" "}
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>

            {/* 댓글 목록 */}
            {comments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">
                아직 댓글이 없습니다.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="border border-border bg-white rounded-xl p-3"
                >
                  <div className="text-sm whitespace-pre-wrap">{c.content}</div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {c.author?.name ?? "익명"} ·{" "}
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}

            {/* 댓글 입력 */}
            <div className="mt-1">
              <textarea
                className="w-full border-[1.5px] border-muted-foreground/30 bg-white rounded-xl p-3 text-sm font-[inherit] min-h-[72px] resize-y mb-3 transition-colors focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="댓글을 입력하세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className={outlineBtnClass}
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

export default GuestRecruitPage;
