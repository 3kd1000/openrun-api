import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const ClubExternalRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [searchParams] = useSearchParams();

  const cid = clubId ? Number(clubId) : NaN;

  const [list, setList] = useState<ExternalRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ExternalRequestType | "">("");
  const [status, setStatus] = useState<ExternalRequestStatus | "">("PENDING");
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<number>>(new Set());
  const [postsById, setPostsById] = useState<Record<number, Post>>({});
  const [commentsByPostId, setCommentsByPostId] = useState<Record<number, Comment[]>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<number, string>>({});
  const [threadLoadingByPostId, setThreadLoadingByPostId] = useState<Record<number, boolean>>({});

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
        postsById[postId] ? Promise.resolve(postsById[postId]) : postService.getPost(cid, postId),
        commentsByPostId[postId] ? Promise.resolve(commentsByPostId[postId]) : commentService.getComments(cid, postId),
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
      const created = await commentService.createComment(cid, postId, { content });
      setCommentsByPostId((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), created] }));
      setCommentDraftByPostId((prev) => ({ ...prev, [postId]: "" }));
    } catch (e) {
      console.error(e);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatScheduleSummary = (r: ExternalRequestResponse) => {
    if (!r.scheduleAt && !r.courtName) return null;
    const at = r.scheduleAt ? new Date(r.scheduleAt).toLocaleString() : "";
    const court = r.courtName ?? "";
    const cap =
      typeof r.currentParticipants === "number" && typeof r.maxCapacity === "number"
        ? `${r.currentParticipants}/${r.maxCapacity}`
        : "";
    return [at, court, cap].filter(Boolean).join(" · ");
  };

  const formatProfileSummary = (r: ExternalRequestResponse) => {
    const parts: string[] = [];
    if (r.ntrp) parts.push(`NTRP ${r.ntrp}`);
    if (r.backhandType === "ONE_HAND") parts.push("원핸드");
    if (r.backhandType === "TWO_HAND") parts.push("투핸드");
    if (r.formerPlayer === true) parts.push("선수출신");
    if (r.tennisStartedAt) parts.push(`시작 ${r.tennisStartedAt}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (
    <div className="club-external-requests-page">
      <div className="club-external-requests-page__header">
        <button className="club-external-requests-page__back-btn" onClick={() => navigate(-1)}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="club-external-requests-page__title">외부 요청</h1>
        <div className="club-external-requests-page__header-spacer" />
      </div>

      <div className="club-external-requests-page__section">
        <div className="club-external-requests-page__filters">
          <div className="club-external-requests-page__filter-row">
            <div className="club-external-requests-page__filter-label">타입</div>
            <div className="club-external-requests-page__chips">
              <button
                className={`club-external-requests-page__chip ${type === "" ? "is-active" : ""}`}
                onClick={() => setType("")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                전체
              </button>
              <button
                className={`club-external-requests-page__chip ${type === "JOIN" ? "is-active" : ""}`}
                onClick={() => setType("JOIN")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                가입
              </button>
              <button
                className={`club-external-requests-page__chip ${type === "GUEST" ? "is-active" : ""}`}
                onClick={() => setType("GUEST")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                게스트
              </button>
              <button
                className={`club-external-requests-page__chip ${type === "INTERCLUB" ? "is-active" : ""}`}
                onClick={() => setType("INTERCLUB")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                교류전
              </button>
            </div>
          </div>

          <div className="club-external-requests-page__filter-row">
            <div className="club-external-requests-page__filter-label">상태</div>
            <div className="club-external-requests-page__chips">
              <button
                className={`club-external-requests-page__chip ${status === "PENDING" ? "is-active" : ""}`}
                onClick={() => setStatus("PENDING")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                대기
              </button>
              <button
                className={`club-external-requests-page__chip ${status === "APPROVED" ? "is-active" : ""}`}
                onClick={() => setStatus("APPROVED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                승인
              </button>
              <button
                className={`club-external-requests-page__chip ${status === "REJECTED" ? "is-active" : ""}`}
                onClick={() => setStatus("REJECTED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                반려
              </button>
              <button
                className={`club-external-requests-page__chip ${status === "CANCELLED" ? "is-active" : ""}`}
                onClick={() => setStatus("CANCELLED")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                취소
              </button>
              <button
                className={`club-external-requests-page__chip ${status === "" ? "is-active" : ""}`}
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
        <div className="club-external-requests-page__empty">요청이 없습니다.</div>
      ) : (
        <div className="club-external-requests-page__list">
          {list.map((r) => (
            <div
              key={r.id}
              className={`club-external-requests-page__card ${expandedRequestIds.has(r.id) ? "is-expanded" : ""}`}
            >
              <div className="club-external-requests-page__card-header">
                <div className="club-external-requests-page__card-title">
                  {typeLabel(r.type)} · {statusLabel(r.status)}
                </div>
              </div>

              <button
                className="club-external-requests-page__card-body"
                type="button"
                onClick={() => void handleToggleCard(r)}
              >
                <div className="club-external-requests-page__meta-row">
                  <span className="club-external-requests-page__meta-strong">{r.requesterName}</span>
                  <span className="club-external-requests-page__meta">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                {formatProfileSummary(r) && (
                  <div className="club-external-requests-page__meta">
                    {formatProfileSummary(r)}
                  </div>
                )}

                {formatScheduleSummary(r) && (
                  <div className="club-external-requests-page__meta">
                    {formatScheduleSummary(r)}
                  </div>
                )}
                {!formatScheduleSummary(r) && r.scheduleId && (
                  <div className="club-external-requests-page__meta">
                    scheduleId: {r.scheduleId}
                  </div>
                )}
              </button>

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
                  ) : threadLoadingByPostId[r.postId] && !postsById[r.postId] ? (
                    <div className="club-external-requests-page__thread-loading">대화를 불러오는 중...</div>
                  ) : (
                    <>
                      {postsById[r.postId] && (
                        <div className="club-external-requests-page__post">
                          <div className="club-external-requests-page__post-content">
                            {sanitizeInquiryText(postsById[r.postId].content)}
                          </div>
                          <div className="club-external-requests-page__post-meta">
                            {postsById[r.postId].author?.name ?? postsById[r.postId].guestName ?? "익명"} ·{" "}
                            {new Date(postsById[r.postId].createdAt).toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="club-external-requests-page__comments">
                        {(commentsByPostId[r.postId] ?? []).length === 0 ? (
                          <div className="club-external-requests-page__thread-empty">아직 댓글이 없습니다.</div>
                        ) : (
                          (commentsByPostId[r.postId] ?? []).map((c) => (
                            <div key={c.id} className="club-external-requests-page__comment">
                              <div className="club-external-requests-page__comment-content">{c.content}</div>
                              <div className="club-external-requests-page__comment-meta">
                                {c.author?.name ?? "익명"} · {new Date(c.createdAt).toLocaleString()}
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
                            setCommentDraftByPostId((prev) => ({ ...prev, [r.postId as number]: e.target.value }))
                          }
                        />
                        <button
                          className="club-external-requests-page__btn-comment"
                          type="button"
                          disabled={threadLoadingByPostId[r.postId] || !(commentDraftByPostId[r.postId] ?? "").trim()}
                          onClick={() => void handleCreateComment(r.postId as number)}
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
    </div>
  );
};

export default ClubExternalRequestsPage;

