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
import { ArrowLeftIcon, LinkIcon } from "../../../components/common/Icons";
import { useToast } from "../../../contexts/ToastContext";
import "./GuestRecruitPage.css";

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
    // 과거 데이터 호환: "[게스트 모집] (바로가기: ...)" 라인이 있으면 제거
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
      // fallback
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

  const load = async () => {
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [scheduleData] = await Promise.all([
        scheduleService.getScheduleById(sid),
      ]);
      setSchedule(scheduleData);

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

  const handleApply = async () => {
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

  if (loading) {
    return (
      <div className="guest-recruit-page">
        <div className="guest-recruit-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="guest-recruit-page">
      <div className="guest-recruit-page__header">
        <button className="guest-recruit-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="guest-recruit-page__title">게스트 모집</h1>
        <button
          className="guest-recruit-page__link-btn"
          onClick={handleCopyLink}
          type="button"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <LinkIcon size={18} />
          <span>링크복사</span>
        </button>
      </div>

      {error && <div className="guest-recruit-page__error">{error}</div>}

      {schedule && (
        <div className="guest-recruit-page__card">
          <div className="guest-recruit-page__info-list">
            {/* 클럽명 */}
            <div className="guest-recruit-page__info-item">
              <span className="guest-recruit-page__info-label">클럽명</span>
              <button
                type="button"
                className="guest-recruit-page__info-value guest-recruit-page__club-link"
                onClick={() => navigate(`/clubs/${cid}/recruiting`, { state: { from: "guest-recruit" } })}
              >
                <span>{schedule.clubName ?? "-"}</span>
                <span className="guest-recruit-page__club-link-indicator">클럽 보기 &gt;</span>
              </button>
            </div>

            {/* 일정 */}
            <div className="guest-recruit-page__info-item">
              <span className="guest-recruit-page__info-label">일정</span>
              <span className="guest-recruit-page__info-value">
                {formatScheduleDateTime(schedule.scheduledAt, schedule.durationMinutes)}
              </span>
            </div>

            {/* 장소 */}
            <div className="guest-recruit-page__info-item">
              <span className="guest-recruit-page__info-label">장소</span>
              <span className="guest-recruit-page__info-value">
                {schedule.courtName}
              </span>
            </div>

            {/* 비용 · 현재/정원 (한 줄) */}
            <div className="guest-recruit-page__info-row">
              <div className="guest-recruit-page__info-item guest-recruit-page__info-item--half">
                <span className="guest-recruit-page__info-label">비용</span>
                <span className="guest-recruit-page__info-value">
                  {schedule.cost != null ? `${schedule.cost.toLocaleString()}원` : "-"}
                </span>
              </div>
              <div className="guest-recruit-page__info-item guest-recruit-page__info-item--half">
                <span className="guest-recruit-page__info-label">현재/정원</span>
                <span className="guest-recruit-page__info-value guest-recruit-page__info-value--highlight">
                  {schedule.currentParticipants}/{schedule.maxCapacity}명
                </span>
              </div>
            </div>

            {/* 모임타입 (선택안함/NONE이면 숨김) */}
            {schedule.matchType && schedule.matchType !== "NONE" && (
              <div className="guest-recruit-page__info-item">
                <span className="guest-recruit-page__info-label">모임타입</span>
                <span className="guest-recruit-page__info-value">
                  {getMatchTypeLabel(schedule.matchType)}
                </span>
              </div>
            )}

            {/* 모집 안내 */}
            {schedule.guestRecruitNote && (
              <div className="guest-recruit-page__info-item guest-recruit-page__info-item--block">
                <span className="guest-recruit-page__info-label">모집 안내</span>
                <div className="guest-recruit-page__recruit-content">
                  {schedule.guestRecruitNote}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="guest-recruit-page__apply">
        <div className="guest-recruit-page__status-row">
          <div className="guest-recruit-page__status-label">신청상태</div>
          <div
            className={`guest-recruit-page__status-value tone-${statusTone}`}
          >
            {statusLabel}
          </div>
        </div>
        <div className="guest-recruit-page__apply-actions">
          {!isApplied ? (
            <button
              className="guest-recruit-page__primary"
              onClick={handleApply}
              disabled={actionLoading}
              type="button"
            >
              신청하기
            </button>
          ) : (
            <button
              className="guest-recruit-page__danger"
              onClick={handleCancel}
              disabled={actionLoading}
              type="button"
            >
              신청취소
            </button>
          )}
        </div>
      </div>

      {!post && (
        <div className="guest-recruit-page__section">
          <div className="guest-recruit-page__section-title">문의하기</div>
          <textarea
            className="guest-recruit-page__textarea"
            placeholder={
              "연락 방법/질문/요청사항 등을 자유롭게 작성해주세요.\n문의글은 신청 여부와 무관하게 남길 수 있어요."
            }
            value={inquiryContent}
            onChange={(e) => setInquiryContent(e.target.value)}
            disabled={actionLoading}
          />
          <button
            className="guest-recruit-page__primary"
            onClick={handleCreateInquiry}
            disabled={actionLoading}
            type="button"
          >
            문의하기
          </button>
        </div>
      )}

      {post && (
        <div className="guest-recruit-page__section">
          <div className="guest-recruit-page__section-title">대화</div>
          <div className="guest-recruit-page__thread">
            <div className="guest-recruit-page__post">
              <div className="guest-recruit-page__post-content">
                {sanitizeInquiryText(post.content)}
              </div>
              <div className="guest-recruit-page__post-meta">
                {post.author?.name ?? post.guestName ?? "익명"} ·{" "}
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="guest-recruit-page__comments">
              {comments.length === 0 ? (
                <div className="guest-recruit-page__hint">
                  아직 댓글이 없습니다.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="guest-recruit-page__comment">
                    <div className="guest-recruit-page__comment-content">
                      {c.content}
                    </div>
                    <div className="guest-recruit-page__comment-meta">
                      {c.author?.name ?? "익명"} ·{" "}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="guest-recruit-page__comment-box">
              <textarea
                className="guest-recruit-page__textarea"
                placeholder="댓글을 입력하세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className="guest-recruit-page__primary"
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
