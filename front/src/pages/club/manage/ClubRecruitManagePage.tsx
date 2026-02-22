import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  clubService,
  type ExternalRequestResponse,
  type ExternalRequestStatus,
  type ExternalRequestType,
} from "../../../services/clubService";
import { ArrowLeftIcon, CheckIcon, XIcon } from "../../../components/common/Icons";
import { postService } from "../../../services/postService";
import { commentService } from "../../../services/commentService";
import type { Post, Comment } from "../../../types/post";
import RequestProfileDrawer from "../../../components/RequestProfileDrawer";
import { FEATURE_FLAGS } from "../../../config/featureFlags";
import { useToast } from "../../../contexts/ToastContext";

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

const chipClass = (active: boolean, disabled: boolean) => {
  const base =
    "px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150";
  const activeStyle = "bg-primary text-white border-primary";
  const inactiveStyle =
    "bg-gray-100 text-gray-600 border-gray-200 hover:border-primary hover:text-primary";
  const disabledStyle = "opacity-50 cursor-not-allowed";
  return [base, active ? activeStyle : inactiveStyle, disabled ? disabledStyle : ""]
    .join(" ")
    .trim();
};

const ClubRecruitManagePage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [searchParams] = useSearchParams();

  const cid = clubId ? Number(clubId) : NaN;

  const [list, setList] = useState<ExternalRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ExternalRequestType | "">("");
  // 상태 필터: "" = 전체, "PENDING" = 미처리, "DONE" = 처리완료(APPROVED/REJECTED/CANCELLED)
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "DONE">("");
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
      // "미처리"만 API에서 필터, "전체"/"처리완료"는 전체 조회 후 클라이언트 필터
      status: statusFilter === "PENDING" ? ("PENDING" as ExternalRequestStatus) : undefined,
    };
  }, [type, statusFilter, targetPostId]);

  const load = async () => {
    if (!Number.isFinite(cid)) return;
    try {
      setLoading(true);
      const data = await clubService.listExternalRequests(cid, params);
      // 최신 요청 상단 정렬
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setList(data);
    } catch (e) {
      console.error(e);
      showToast("외부요청 목록을 불러오지 못했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  // "처리완료" 필터는 클라이언트에서 적용 (API는 단일 status만 지원)
  const filteredList = useMemo(() => {
    if (statusFilter === "DONE") {
      return list.filter((r) => r.status !== "PENDING");
    }
    return list;
  }, [list, statusFilter]);

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
      showToast("승인에 실패했습니다", "error");
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
      showToast("반려에 실패했습니다", "error");
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
      showToast("댓글 작성에 실패했습니다", "error");
    } finally {
      setThreadLoadingByPostId((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="page-container px-3 py-2 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">가입관리</span>
        <div className="w-9 h-9" />
      </div>

      {/* Filters (sticky) */}
      <div className="sticky top-0 z-10 bg-white border border-border rounded-xl px-4 py-2 mb-3 shadow-sm">
        <div className="flex flex-col gap-1">
          {/* Type filter row */}
          <div className="flex items-center gap-2">
            <span className="w-9 flex-none text-xs font-semibold text-gray-400">
              타입
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                className={chipClass(type === "", Boolean(targetPostId))}
                onClick={() => setType("")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                전체
              </button>
              <button
                className={chipClass(type === "JOIN", Boolean(targetPostId))}
                onClick={() => setType("JOIN")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                가입문의
              </button>
              <button
                className={chipClass(type === "GUEST", Boolean(targetPostId))}
                onClick={() => setType("GUEST")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                게스트문의
              </button>
              {FEATURE_FLAGS.INTERCLUB_ENABLED && (
                <button
                  className={chipClass(
                    type === "INTERCLUB",
                    Boolean(targetPostId)
                  )}
                  onClick={() => setType("INTERCLUB")}
                  type="button"
                  disabled={Boolean(targetPostId)}
                >
                  교류전
                </button>
              )}
            </div>
          </div>

          {/* Status filter row */}
          <div className="flex items-center gap-2">
            <span className="w-9 flex-none text-xs font-semibold text-gray-400">
              상태
            </span>
            <div className="flex gap-2">
              <button
                className={chipClass(statusFilter === "", Boolean(targetPostId))}
                onClick={() => setStatusFilter("")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                전체
              </button>
              <button
                className={chipClass(statusFilter === "PENDING", Boolean(targetPostId))}
                onClick={() => setStatusFilter("PENDING")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                미처리
              </button>
              <button
                className={chipClass(statusFilter === "DONE", Boolean(targetPostId))}
                onClick={() => setStatusFilter("DONE")}
                type="button"
                disabled={Boolean(targetPostId)}
              >
                처리완료
              </button>
            </div>
          </div>

          {targetPostId && (
            <p className="text-xs text-gray-500 pt-0.5">
              문의글에서 이동한 상세 보기입니다. (필터 고정)
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 text-sm text-gray-500">로딩 중...</div>
      ) : filteredList.length === 0 ? (
        <div className="py-8 text-sm text-gray-500">해당하는 요청이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredList.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-border p-4 shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                <span className="font-bold text-sm text-gray-900">
                  {typeLabel(r.type)} · {statusLabel(r.status)}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex flex-col gap-2">
                {/* 작성자 */}
                <div className="grid gap-2 items-baseline" style={{ gridTemplateColumns: "90px 1fr" }}>
                  <span className="text-xs font-medium text-gray-400">작성자</span>
                  <button
                    className="text-xs font-semibold text-primary underline text-left cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none p-0"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDrawer({ userId: r.requesterUserId });
                    }}
                  >
                    {r.requesterName}
                  </button>
                </div>

                {/* 작성일시 */}
                <div className="grid gap-2 items-baseline" style={{ gridTemplateColumns: "90px 1fr" }}>
                  <span className="text-xs font-medium text-gray-400">작성일시</span>
                  <span className="text-xs font-medium text-gray-800">
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>

                {/* 선택된 일정 */}
                {r.scheduleAt && (
                  <div className="grid gap-2 items-baseline" style={{ gridTemplateColumns: "90px 1fr" }}>
                    <span className="text-xs font-medium text-gray-400">선택된 일정</span>
                    <button
                      className={[
                        "text-xs font-semibold text-left bg-transparent border-none p-0 transition-opacity",
                        r.scheduleId
                          ? "text-primary underline cursor-pointer hover:opacity-70"
                          : "text-gray-500 no-underline cursor-default",
                      ].join(" ")}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.scheduleId) {
                          navigate(`/schedules/${r.scheduleId}`, {
                            state: {
                              returnUrl:
                                window.location.pathname +
                                window.location.search,
                            },
                          });
                        }
                      }}
                      disabled={!r.scheduleId}
                    >
                      {formatDateTime(r.scheduleAt)}
                    </button>
                  </div>
                )}

                {/* 코트명 · 인원 */}
                {(r.courtName ||
                  (typeof r.currentParticipants === "number" &&
                    typeof r.maxCapacity === "number")) && (
                  <div className="grid gap-2 items-baseline" style={{ gridTemplateColumns: "90px 1fr" }}>
                    <span className="text-xs font-medium text-gray-400">코트명 · 인원</span>
                    <span className="text-xs font-medium text-gray-800">
                      {r.courtName || "-"} ·{" "}
                      {typeof r.currentParticipants === "number" &&
                      typeof r.maxCapacity === "number"
                        ? `${r.currentParticipants}/${r.maxCapacity}`
                        : "-"}
                    </span>
                  </div>
                )}

                {/* 모임 타입 */}
                {matchTypeLabel(r.matchType) && (
                  <div className="grid gap-2 items-baseline" style={{ gridTemplateColumns: "90px 1fr" }}>
                    <span className="text-xs font-medium text-gray-400">모임 타입</span>
                    <span className="text-xs font-medium text-gray-800">
                      {matchTypeLabel(r.matchType)}
                    </span>
                  </div>
                )}

                {/* 상세보기 토글 */}
                <button
                  className="mt-2 w-full py-1.5 px-4 border border-border bg-white rounded-lg text-xs font-medium text-gray-500 cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400"
                  type="button"
                  onClick={() => void handleToggleCard(r)}
                >
                  {expandedRequestIds.has(r.id) ? "접기" : "상세보기"}
                </button>
              </div>

              {/* Action Buttons (PENDING only) */}
              {r.status === "PENDING" && (
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border">
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white border border-transparent transition-all hover:opacity-90"
                    onClick={() => handleApprove(r.id)}
                    type="button"
                  >
                    <CheckIcon size={18} />
                    <span>승인</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-400 text-red-500 bg-transparent transition-all hover:bg-red-50"
                    onClick={() => handleReject(r.id)}
                    type="button"
                  >
                    <XIcon size={18} />
                    <span>반려</span>
                  </button>
                </div>
              )}

              {/* Thread / Comments (expanded) */}
              {expandedRequestIds.has(r.id) && (
                <div className="mt-3 flex flex-col gap-3">
                  {!r.postId ? (
                    <div className="p-3 border border-border rounded-xl bg-gray-50 text-xs text-gray-500">
                      문의글이 아직 없습니다.
                    </div>
                  ) : threadLoadingByPostId[r.postId] &&
                    !postsById[r.postId] ? (
                    <div className="p-3 border border-border rounded-xl bg-gray-50 text-xs text-gray-500">
                      대화를 불러오는 중...
                    </div>
                  ) : (
                    <>
                      {/* Original post */}
                      {postsById[r.postId] && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-900">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {sanitizeInquiryText(postsById[r.postId].content)}
                          </p>
                          <p className="mt-1.5 text-xs text-gray-500">
                            {postsById[r.postId].author?.name ??
                              postsById[r.postId].guestName ??
                              "익명"}{" "}
                            · {formatDateTime(postsById[r.postId].createdAt)}
                          </p>
                        </div>
                      )}

                      {/* Comments list */}
                      <div className="flex flex-col gap-2">
                        {(commentsByPostId[r.postId] ?? []).length === 0 ? (
                          <div className="p-3 border border-border rounded-xl bg-gray-50 text-xs text-gray-500">
                            아직 댓글이 없습니다.
                          </div>
                        ) : (
                          (commentsByPostId[r.postId] ?? []).map((c) => (
                            <div
                              key={c.id}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-900"
                            >
                              <p className="text-sm text-gray-900">
                                {c.content}
                              </p>
                              <p className="mt-1.5 text-xs text-gray-500">
                                {c.author?.name ?? "익명"} ·{" "}
                                {formatDateTime(c.createdAt)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment input */}
                      <div className="flex flex-col gap-2.5">
                        <textarea
                          className="w-full min-h-[72px] rounded-xl border border-gray-900 bg-white p-3 text-xs resize-y focus:outline-none focus:border-gray-900"
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
                          className="w-full py-2.5 px-3 rounded-xl text-sm font-extrabold bg-primary text-white disabled:opacity-50 transition-opacity"
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
    </div>
  );
};

export default ClubRecruitManagePage;
