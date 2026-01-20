import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  clubService,
  type ExternalRequestResponse,
  type ExternalRequestStatus,
  type ExternalRequestType,
} from "../../services/clubService";
import { ArrowLeftIcon, CheckIcon, XIcon } from "../../components/common/Icons";
import { postService } from "../../services/postService";
import { commentService } from "../../services/commentService";
import type { Post, Comment } from "../../types/post";
import RequestProfileDrawer from "../../components/RequestProfileDrawer";
import ScheduleDetailModal from "../schedule/components/ScheduleDetailModal";
import { FEATURE_FLAGS } from "../../config/featureFlags";
import "./ClubExternalRequestsPage.css";

const typeLabel = (t: ExternalRequestType) => {
  if (t === "JOIN") return "가입 신청";
  if (t === "GUEST") return "게스트 신청";
  if (t === "INTERCLUB") return "교류전 신청";
  return t;
};

const statusLabel = (s: ExternalRequestStatus) => {
  if (s === "PENDING") return "대기중";
  if (s === "APPROVED") return "승인";
  if (s === "REJECTED") return "반려";
  if (s === "CANCELLED") return "취소";
  return s;
};

const matchTypeLabel = (mt: string | null | undefined) => {
  if (!mt) return null;
  if (mt === "NONE") return "선택안함";
  if (mt === "MEN_DOUBLES") return "남복";
  if (mt === "WOMEN_DOUBLES") return "여복";
  if (mt === "MIXED_DOUBLES") return "혼복";
  if (mt === "SINGLES") return "단식";
  return mt;
};

const formatDateTime = (dateStr: string) => {
  return format(new Date(dateStr), "yyyy. M. d. HH:mm");
};

const ClubExternalRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [searchParams] = useSearchParams();

  const cid = clubId ? Number(clubId) : NaN;

  const [list, setList] = useState<ExternalRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ExternalRequestType | "">("");
  const [status, setStatus] = useState<ExternalRequestStatus | "">("PENDING");
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<number>>(
    new Set()
  );
  const [postsById, setPostsById] = useState<Record<number, Post>>({});
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<number, Comment[]>
  >({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<
    Record<number, string>
  >({});
  const [threadLoadingByPostId, setThreadLoadingByPostId] = useState<
    Record<number, boolean>
  >({});
  const [profileDrawer, setProfileDrawer] = useState<{
    userId: number;
  } | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );

  const targetPostId = useMemo(() => {
    const raw = searchParams.get("postId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const params = useMemo(() => {
    // postId 딥링크로 들어온 경우: 해당 스레드가 항상 보이도록 필터는 무시
    if (targetPostId) {
      return { postId: targetPostId };
    }
    return {
      type: type || undefined,
      status: status || undefined,
    };
  }, [type, status, targetPostId]);

  const load = async () => {
    if (!Number.isFinite(cid)) return;
    try {
      setLoading(true);
      const data = await clubService.listExternalRequests(cid, params);
      setList(data);
    } catch (e) {
      console.error(e);
      alert("외부요청 목록을 불러오지 못했습니다. (운영진 권한이 필요합니다)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, params.type, params.status]);

  useEffect(() => {
    if (!targetPostId) return;
    if (loading) return;
    const target = list.find((r) => r.postId === targetPostId);
    if (target) {
      setExpandedRequestIds(new Set([target.id]));
      void ensureThreadLoaded(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPostId, loading, list.length]);

  const handleApprove = async (requestId: number) => {
    if (!Number.isFinite(cid)) return;
    if (!confirm("승인하시겠습니까?")) return;
    try {
      await clubService.approveExternalRequest(cid, requestId);
      await load();
    } catch (e) {
      console.error(e);
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (requestId: number) => {
    if (!Number.isFinite(cid)) return;
    if (!confirm("반려하시겠습니까?")) return;
    try {
      await clubService.rejectExternalRequest(cid, requestId);
      await load();
    } catch (e) {
      console.error(e);
      alert("반려에 실패했습니다.");
    }
  };

  const sanitizeInquiryText = (text: string) => {
    return text
      .replace(/^\[게스트 모집\]\s*\(바로가기:.*\)\s*\n?/m, "[게스트 모집]\n")
      .trim();
  };

  const ensureThreadLoaded = async (r: ExternalRequestResponse) => {
    if (!r.postId) return;
    const postId = r.postId;
    if (postsById[postId] && commentsByPostId[postId]) return;

    setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: true }));
    try {
      const [p, cs] = await Promise.all([
        postsById[postId]
          ? Promise.resolve(postsById[postId])
          : postService.getPost(cid, postId),
        commentsByPostId[postId]
          ? Promise.resolve(commentsByPostId[postId])
          : commentService.getComments(cid, postId),
      ]);
      setPostsById((prev) => ({ ...prev, [postId]: p }));
      setCommentsByPostId((prev) => ({ ...prev, [postId]: cs }));
    } finally {
      setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleCard = async (r: ExternalRequestResponse) => {
    setExpandedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
    if (r.postId) {
      await ensureThreadLoaded(r);
    }
  };

  const handleCreateComment = async (postId: number) => {
    if (!Number.isFinite(cid)) return;
    const content = (commentDraftByPostId[postId] ?? "").trim();
    if (!content) return;
    try {
      setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: true }));
      const created = await commentService.createComment(cid, postId, {
        content,
      });
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), created],
      }));
      setCommentDraftByPostId((prev) => ({ ...prev, [postId]: "" }));
    } catch (e) {
      console.error(e);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="club-external-requests-page">
      <div className="club-external-requests-page__header">
        <button
          className="club-external-requests-page__back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-external-requests-page__title">외부 요청</h1>
        <div className="club-external-requests-page__header-spacer" />
      </div>

      <div className="club-external-requests-page__section">
        <div className="club-external-requests-page__filters">
          <div className="club-external-requests-page__filter-row">
            <div className="club-external-requests-page__filter-label">
              타입
            </div>
            <div className="club-external-requests-page__chips">
              <button
                className={`club-external-requests-page__chip ${
                  type === "" ? "is-active" : ""
                }`}
                onClick={() => setType("")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                전체
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  type === "JOIN" ? "is-active" : ""
                }`}
                onClick={() => setType("JOIN")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                가입
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  type === "GUEST" ? "is-active" : ""
                }`}
                onClick={() => setType("GUEST")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                게스트
              </button>
              {FEATURE_FLAGS.INTERCLUB_ENABLED && (
                <button
                  className={`club-external-requests-page__chip ${
                    type === "INTERCLUB" ? "is-active" : ""
                  }`}
                  onClick={() => setType("INTERCLUB")}
                  type="button"
                  disabled={Boolean(targetPostId)}
                >
                  교류전
                </button>
              )}
            </div>
          </div>

          <div className="club-external-requests-page__filter-row">
            <div className="club-external-requests-page__filter-label">
              상태
            </div>
            <div className="club-external-requests-page__chips">
              <button
                className={`club-external-requests-page__chip ${
                  status === "PENDING" ? "is-active" : ""
                }`}
                onClick={() => setStatus("PENDING")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                대기
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  status === "APPROVED" ? "is-active" : ""
                }`}
                onClick={() => setStatus("APPROVED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                승인
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  status === "REJECTED" ? "is-active" : ""
                }`}
                onClick={() => setStatus("REJECTED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                반려
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  status === "CANCELLED" ? "is-active" : ""
                }`}
                onClick={() => setStatus("CANCELLED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                취소
              </button>
              <button
                className={`club-external-requests-page__chip ${
                  status === "" ? "is-active" : ""
                }`}
                onClick={() => setStatus("")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                전체
              </button>
            </div>
          </div>

          {targetPostId && (
            <div className="club-external-requests-page__filter-hint">
              문의글에서 이동한 상세 보기입니다. (필터 고정)
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="club-external-requests-page__loading">로딩 중...</div>
      ) : list.length === 0 ? (
        <div className="club-external-requests-page__empty">
          처리할 요청이 없습니다.
        </div>
      ) : (
        <div className="club-external-requests-page__list">
          {list.map((r) => (
            <div
              key={r.id}
              className={`club-external-requests-page__card ${
                expandedRequestIds.has(r.id) ? "is-expanded" : ""
              }`}
            >
              <div className="club-external-requests-page__card-header">
                <div className="club-external-requests-page__card-title">
                  {typeLabel(r.type)} · {statusLabel(r.status)}
                </div>
              </div>

              <div className="club-external-requests-page__card-body">
                <div className="club-external-requests-page__info-row">
                  <span className="club-external-requests-page__label">
                    작성자
                  </span>
                  <button
                    className="club-external-requests-page__author-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDrawer({ userId: r.requesterUserId });
                    }}
                  >
                    {r.requesterName}
                  </button>
                </div>

                <div className="club-external-requests-page__info-row">
                  <span className="club-external-requests-page__label">
                    작성일시
                  </span>
                  <span className="club-external-requests-page__value">
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>

                {r.scheduleAt && (
                  <div className="club-external-requests-page__info-row">
                    <span className="club-external-requests-page__label">
                      선택된 일정
                    </span>
                    <button
                      className="club-external-requests-page__schedule-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.scheduleId) {
                          setSelectedScheduleId(r.scheduleId);
                        }
                      }}
                      disabled={!r.scheduleId}
                    >
                      {formatDateTime(r.scheduleAt)}
                    </button>
                  </div>
                )}

                {(r.courtName ||
                  (typeof r.currentParticipants === "number" &&
                    typeof r.maxCapacity === "number")) && (
                  <div className="club-external-requests-page__info-row">
                    <span className="club-external-requests-page__label">
                      코트명 · 인원
                    </span>
                    <span className="club-external-requests-page__value">
                      {r.courtName || "-"} ·{" "}
                      {typeof r.currentParticipants === "number" &&
                      typeof r.maxCapacity === "number"
                        ? `${r.currentParticipants}/${r.maxCapacity}`
                        : "-"}
                    </span>
                  </div>
                )}

                {matchTypeLabel(r.matchType) && (
                  <div className="club-external-requests-page__info-row">
                    <span className="club-external-requests-page__label">
                      모임 타입
                    </span>
                    <span className="club-external-requests-page__value">
                      {matchTypeLabel(r.matchType)}
                    </span>
                  </div>
                )}

                <button
                  className="club-external-requests-page__expand-btn"
                  type="button"
                  onClick={() => void handleToggleCard(r)}
                >
                  {expandedRequestIds.has(r.id) ? "접기" : "상세보기"}
                </button>
              </div>

              {r.status === "PENDING" && (
                <div className="club-external-requests-page__card-actions">
                  <button
                    className="club-external-requests-page__btn-approve"
                    onClick={() => handleApprove(r.id)}
                    type="button"
                  >
                    <CheckIcon size={18} />
                    <span>승인</span>
                  </button>
                  <button
                    className="club-external-requests-page__btn-reject"
                    onClick={() => handleReject(r.id)}
                    type="button"
                  >
                    <XIcon size={18} />
                    <span>반려</span>
                  </button>
                </div>
              )}

              {expandedRequestIds.has(r.id) && (
                <div className="club-external-requests-page__thread">
                  {!r.postId ? (
                    <div className="club-external-requests-page__thread-empty">
                      문의글이 아직 없습니다.
                    </div>
                  ) : threadLoadingByPostId[r.postId] &&
                    !postsById[r.postId] ? (
                    <div className="club-external-requests-page__thread-loading">
                      대화를 불러오는 중...
                    </div>
                  ) : (
                    <>
                      {postsById[r.postId] && (
                        <div className="club-external-requests-page__post">
                          <div className="club-external-requests-page__post-content">
                            {sanitizeInquiryText(postsById[r.postId].content)}
                          </div>
                          <div className="club-external-requests-page__post-meta">
                            {postsById[r.postId].author?.name ??
                              postsById[r.postId].guestName ??
                              "익명"}{" "}
                            · {formatDateTime(postsById[r.postId].createdAt)}
                          </div>
                        </div>
                      )}

                      <div className="club-external-requests-page__comments">
                        {(commentsByPostId[r.postId] ?? []).length === 0 ? (
                          <div className="club-external-requests-page__thread-empty">
                            아직 댓글이 없습니다.
                          </div>
                        ) : (
                          (commentsByPostId[r.postId] ?? []).map((c) => (
                            <div
                              key={c.id}
                              className="club-external-requests-page__comment"
                            >
                              <div className="club-external-requests-page__comment-content">
                                {c.content}
                              </div>
                              <div className="club-external-requests-page__comment-meta">
                                {c.author?.name ?? "익명"} ·{" "}
                                {formatDateTime(c.createdAt)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="club-external-requests-page__comment-box">
                        <textarea
                          className="club-external-requests-page__textarea"
                          placeholder="운영진 답변을 댓글로 남겨주세요"
                          value={commentDraftByPostId[r.postId] ?? ""}
                          onChange={(e) =>
                            setCommentDraftByPostId((prev) => ({
                              ...prev,
                              [r.postId as number]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="club-external-requests-page__btn-comment"
                          type="button"
                          disabled={
                            threadLoadingByPostId[r.postId] ||
                            !(commentDraftByPostId[r.postId] ?? "").trim()
                          }
                          onClick={() =>
                            void handleCreateComment(r.postId as number)
                          }
                        >
                          댓글 작성
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {profileDrawer && (
        <RequestProfileDrawer
          clubId={cid}
          userId={profileDrawer.userId}
          onClose={() => setProfileDrawer(null)}
        />
      )}

      {selectedScheduleId && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          onClose={() => setSelectedScheduleId(null)}
          onSuccess={() => {
            setSelectedScheduleId(null);
            void load();
          }}
        />
      )}
    </div>
  );
};

export default ClubExternalRequestsPage;
