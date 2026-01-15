import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { scheduleService } from "../../services/scheduleService";
import { clubService, type ExternalRequestResponse } from "../../services/clubService";
import { postService } from "../../services/postService";
import { commentService } from "../../services/commentService";
import type { Schedule } from "../../types/schedule";
import type { Post, Comment } from "../../types/post";
import { ArrowLeftIcon, CopyIcon } from "../../components/common/Icons";
import "./InterclubRecruitPage.css";

const InterclubRecruitPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId, scheduleId } = useParams<{ clubId: string; scheduleId: string }>();

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
      alert("링크가 복사되었습니다.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("링크가 복사되었습니다.");
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

  const handleApply = async () => {
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    try {
      setActionLoading(true);
      const req = await clubService.applyInterclubRecruit(cid, sid);
      setMyReq(req);
      alert("신청이 완료되었습니다.");
    } catch (e) {
      console.error(e);
      alert("신청에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    if (!confirm("신청을 취소할까요?")) return;
    try {
      setActionLoading(true);
      const req = await clubService.cancelInterclubRecruit(cid, sid);
      setMyReq(req);
    } catch (e) {
      console.error(e);
      alert("취소에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInquiry = async () => {
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) return;
    if (!inquiryContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await clubService.createInterclubRecruitInquiry(cid, sid, inquiryContent.trim());
      setPost(created);
      setInquiryContent("");
      const cs = await commentService.getComments(cid, created.id);
      setComments(cs);
      alert("문의글이 등록되었습니다.");
    } catch (e) {
      console.error(e);
      alert("문의글 등록에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!Number.isFinite(cid) || !post) return;
    if (!commentContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await commentService.createComment(cid, post.id, { content: commentContent.trim() });
      setComments((prev) => [...prev, created]);
      setCommentContent("");
    } catch (e) {
      console.error(e);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="interclub-recruit-page">
        <div className="interclub-recruit-page__loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="interclub-recruit-page">
      <div className="interclub-recruit-page__header">
        <button className="interclub-recruit-page__back-btn" onClick={handleBack}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="interclub-recruit-page__title">교류전 모집</h1>
        <button
          className="interclub-recruit-page__copy-btn"
          onClick={handleCopyLink}
          type="button"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <CopyIcon size={18} />
        </button>
      </div>

      {error && <div className="interclub-recruit-page__error">{error}</div>}

      {schedule && (
        <div className="interclub-recruit-page__card">
          <div className="interclub-recruit-page__row">
            <div className="interclub-recruit-page__label">일정</div>
            <div className="interclub-recruit-page__value">
              {format(new Date(schedule.scheduledAt), "yyyy년 M월 d일 (E) HH:mm", { locale: ko })}
            </div>
          </div>
          <div className="interclub-recruit-page__row">
            <div className="interclub-recruit-page__label">장소</div>
            <div className="interclub-recruit-page__value">{schedule.courtName}</div>
          </div>
          <div className="interclub-recruit-page__row">
            <div className="interclub-recruit-page__label">비용</div>
            <div className="interclub-recruit-page__value">{schedule.cost ?? "-"}</div>
          </div>
          <div className="interclub-recruit-page__row">
            <div className="interclub-recruit-page__label">현재/정원</div>
            <div className="interclub-recruit-page__value">
              {schedule.currentParticipants}/{schedule.maxCapacity}
            </div>
          </div>
          {schedule.interclubRecruitNote && (
            <div className="interclub-recruit-page__note">{schedule.interclubRecruitNote}</div>
          )}
        </div>
      )}

      <div className="interclub-recruit-page__apply">
        <div className="interclub-recruit-page__status-row">
          <div className="interclub-recruit-page__status-label">신청상태</div>
          <div className={`interclub-recruit-page__status-value tone-${statusTone}`}>{statusLabel}</div>
        </div>
        <div className="interclub-recruit-page__apply-actions">
          {!isApplied ? (
            <button className="interclub-recruit-page__primary" onClick={handleApply} disabled={actionLoading} type="button">
              신청하기
            </button>
          ) : (
            <button className="interclub-recruit-page__danger" onClick={handleCancel} disabled={actionLoading} type="button">
              신청취소
            </button>
          )}
        </div>
      </div>

      {!post && (
        <div className="interclub-recruit-page__section">
          <div className="interclub-recruit-page__section-title">문의하기</div>
          <textarea
            className="interclub-recruit-page__textarea"
            placeholder={
              "연락 방법/질문/요청사항 등을 자유롭게 작성해주세요.\n\n(문의글은 신청 여부와 무관하게 남길 수 있어요. 운영진 답변은 댓글로 달립니다)"
            }
            value={inquiryContent}
            onChange={(e) => setInquiryContent(e.target.value)}
            disabled={actionLoading}
          />
          <button className="interclub-recruit-page__primary" onClick={handleCreateInquiry} disabled={actionLoading} type="button">
            문의를 남기기
          </button>
        </div>
      )}

      {post && (
        <div className="interclub-recruit-page__section">
          <div className="interclub-recruit-page__section-title">대화</div>
          <div className="interclub-recruit-page__thread">
            <div className="interclub-recruit-page__post">
              <div className="interclub-recruit-page__post-content">{sanitizeInquiryText(post.content)}</div>
              <div className="interclub-recruit-page__post-meta">
                {post.author?.name ?? post.guestName ?? "익명"} · {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="interclub-recruit-page__comments">
              {comments.length === 0 ? (
                <div className="interclub-recruit-page__hint">아직 댓글이 없습니다.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="interclub-recruit-page__comment">
                    <div className="interclub-recruit-page__comment-content">{c.content}</div>
                    <div className="interclub-recruit-page__comment-meta">
                      {c.author?.name ?? "익명"} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="interclub-recruit-page__comment-box">
              <textarea
                className="interclub-recruit-page__textarea"
                placeholder="댓글을 입력하세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className="interclub-recruit-page__primary"
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

