import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import {
  MapPinIcon,
  UsersIcon,
  CalendarIcon,
} from "../../../components/common/Icons";
import { Link2 } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { Button } from "@/components/ui/button";
import {
  clubService,
  type ExternalRequestResponse,
} from "../../../services/clubService";
import { postService } from "../../../services/postService";
import { commentService } from "../../../services/commentService";
import type { Post, Comment } from "../../../types/post";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useLoginGuard } from "../../../hooks/useLoginGuard";
import { syncClubList } from "../../../services/api/userApi";
import { useToast } from "../../../contexts/ToastContext";

const ClubRecruitingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requireLogin = useLoginGuard();
  const { clubId } = useParams<{ clubId: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [joinStatus, setJoinStatus] = useState<
    "NONE" | "PENDING" | "ACTIVE" | "REJECTED"
  >("NONE");
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_joinReq, setJoinReq] = useState<ExternalRequestResponse | null>(null);
  const [joinPost, setJoinPost] = useState<Post | null>(null);
  const [joinComments, setJoinComments] = useState<Comment[]>([]);
  const [joinInquiryContent, setJoinInquiryContent] = useState("");
  const [joinCommentContent, setJoinCommentContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  const currentUserId = useMemo(() => {
    const session = getOpenRunSession();
    const raw = session.userId?.toString();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const fetchClubDetail = useCallback(async () => {
    if (!clubId) return;
    try {
      const response = await axiosInstance.get(`/clubs/${clubId}`);
      setClub(response.data);
    } catch (error) {
      console.error("Failed to fetch club detail:", error);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // 로그인한 사용자의 가입 상태 확인 (로그인 시에만 호출)
  const fetchMyMembership = useCallback(async () => {
    if (!clubId || !currentUserId) return;
    try {
      const response = await axiosInstance.get<{ userId: number; status: string }[]>(
        `/clubs/${clubId}/membership`,
        { params: { status: "ACTIVE" } }
      );
      const me = response.data?.find((m) => m.userId === currentUserId);
      if (me) {
        setJoinStatus("ACTIVE");
      }
    } catch {
      // 비로그인이거나 권한 없으면 무시
    }
  }, [clubId, currentUserId]);

  const sanitizeJoinInquiryText = (text: string) => {
    return text.replace(/^\[가입 문의\]\s*\n?/m, "[가입 문의]\n").trim();
  };

  const fetchJoinInquiryThread = useCallback(async () => {
    if (!clubId) return;
    if (!currentUserId) return; // 로그인 전에는 내 스레드 조회 불가
    try {
      const req = await clubService.getMyJoinRequest(Number(clubId));
      setJoinReq(req);
      if (req.postId) {
        const p = await postService.getPost(Number(clubId), req.postId);
        setJoinPost(p);
        const cs = await commentService.getComments(Number(clubId), req.postId);
        setJoinComments(cs);
      } else {
        setJoinPost(null);
        setJoinComments([]);
      }
    } catch {
      // 아직 스레드가 없거나(404), 권한(401) 등은 무시
      setJoinReq(null);
      setJoinPost(null);
      setJoinComments([]);
    }
  }, [clubId, currentUserId]);

  useEffect(() => {
    if (clubId) {
      fetchClubDetail();
      fetchMyMembership();
      fetchJoinInquiryThread();
    }
  }, [clubId, fetchClubDetail, fetchMyMembership, fetchJoinInquiryThread]);

  const handleJoinRequest = async () => {
    if (!requireLogin()) return;
    if (!confirm("가입 신청하시겠습니까?")) return;
    try {
      const response = await axiosInstance.post<{ autoApproved: boolean; message: string }>(
        `/clubs/${clubId}/join`
      );
      const { autoApproved, message } = response.data;

      if (autoApproved) {
        // 자동승인인 경우 세션 업데이트 후 클럽 메인페이지로 이동
        await syncClubList();
        showToast(message, "success");
        navigate(`/clubs/${clubId}`);
      } else {
        // 수동승인인 경우 대기 상태로 업데이트
        showToast(message, "success");
        setJoinStatus("PENDING");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      showToast("가입 신청 실패: " + (errorMessage || "오류 발생"), "error");
    }
  };

  const handleCreateJoinInquiry = async () => {
    if (!clubId) return;
    if (!requireLogin()) return;
    if (!joinInquiryContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await clubService.createJoinInquiry(
        Number(clubId),
        joinInquiryContent.trim()
      );
      setJoinPost(created);
      setJoinInquiryContent("");
      // 스레드 생성 후 댓글 로드
      const cs = await commentService.getComments(Number(clubId), created.id);
      setJoinComments(cs);
      // my-request도 재조회(외부요청 인박스 연동용)
      await fetchJoinInquiryThread();
      showToast("가입 문의가 등록되었습니다", "success");
    } catch (e) {
      console.error(e);
      showToast("가입 문의 등록에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateJoinComment = async () => {
    if (!clubId) return;
    if (!requireLogin()) return;
    if (!joinPost) return;
    if (!joinCommentContent.trim()) return;
    try {
      setActionLoading(true);
      const created = await commentService.createComment(
        Number(clubId),
        joinPost.id,
        { content: joinCommentContent.trim() }
      );
      setJoinComments((prev) => [...prev, created]);
      setJoinCommentContent("");
    } catch (e) {
      console.error(e);
      showToast("댓글 작성에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // activitySummary 파싱 ("총 X개 일정, Y명 참가")
  const activityStats = useMemo(() => {
    if (!club?.activitySummary) return null;
    const match = club.activitySummary.match(/총\s*(\d+)개\s*일정.*?(\d+)명\s*참가/);
    if (!match) return null;
    return { schedules: Number(match[1]), participants: Number(match[2]) };
  }, [club?.activitySummary]);

  if (loading) return <div>Loading...</div>;
  if (!club) return <div>Club not found</div>;

  const outlineBtnClass =
    "w-full border-[1.5px] border-primary rounded-xl py-3.5 text-base font-bold bg-transparent text-primary cursor-pointer transition-all hover:bg-primary/5 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:border-muted-foreground disabled:text-muted-foreground";

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="relative flex items-center justify-between py-2 mb-3">
        <BackButton
          onClick={() => {
            const state = location.state as { fromClubMain?: boolean; from?: string; returnUrl?: string } | null;
            if (state?.returnUrl) {
              navigate(state.returnUrl);
            } else if (state?.from === "guest-recruit") {
              navigate(-1);
            } else if (state?.fromClubMain) {
              navigate(`/clubs/${clubId}`);
            } else {
              navigate(-1);
            }
          }}
        />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-foreground pointer-events-none">클럽 초대</span>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={async () => {
            const url = `${window.location.origin}/clubs/${clubId}/recruiting`;
            try {
              await navigator.clipboard.writeText(url);
              showToast("초대링크가 복사되었습니다", "success");
            } catch {
              prompt("아래 링크를 복사하세요:", url);
            }
          }}
        >
          <Link2 size={14} className="mr-1" />
          링크복사
        </Button>
      </div>

      {/* 클럽 히어로 카드 */}
      <div className="rounded-2xl overflow-hidden border border-border bg-white">
        {/* 에메랄드 배너 */}
        <div className="bg-primary px-6 pt-6 pb-5">
          <div className="flex items-center gap-4 mb-2">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={`${club.name} 로고`}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-white/30"
              />
            ) : null}
            <h2 className="text-xl font-bold text-white leading-tight break-words">
              {club.name}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {club.region && (
              <span className="inline-flex items-center gap-1 text-sm text-white/85">
                <MapPinIcon size={14} color="currentColor" />
                {club.region}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm text-white/85">
              <UsersIcon size={14} color="currentColor" />
              {club.memberCount ?? 0}명
            </span>
          </div>
        </div>

        {/* 활동 통계 */}
        {activityStats && (
          <div className="grid grid-cols-2 border-b border-border">
            <div className="flex flex-col items-center py-4 border-r border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <CalendarIcon size={14} />
                <span className="text-xs">총 일정</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {activityStats.schedules}개
              </span>
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <UsersIcon size={14} />
                <span className="text-xs">총 참가</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {activityStats.participants}명
              </span>
            </div>
          </div>
        )}

        {/* 가입 신청 */}
        <div className="px-6 py-5">
          {joinStatus === "ACTIVE" && (
            <button className={outlineBtnClass} disabled type="button">
              이미 가입된 클럽입니다.
            </button>
          )}
          {joinStatus === "PENDING" && (
            <button className={outlineBtnClass} disabled type="button">
              가입 대기중
            </button>
          )}
          {joinStatus === "NONE" && (
            <button
              className="w-full rounded-xl py-3.5 text-base font-bold bg-primary text-white cursor-pointer transition-all hover:bg-primary/90 hover:-translate-y-px"
              onClick={handleJoinRequest}
              type="button"
            >
              가입 신청
            </button>
          )}
        </div>
      </div>

      {/* 클럽 소개 */}
      <div className="border border-border rounded-2xl bg-white p-6 mt-4">
        <div className="text-sm font-bold mb-3">클럽 소개</div>
        {club.description ? (
          <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
            {club.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">아직 클럽 소개가 등록되지 않았습니다.</p>
        )}
      </div>

      {/* 모집 안내 */}
      {club.memberRecruitmentOpen && club.memberRecruitmentNote && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className="text-sm font-bold text-primary mb-3">모집 안내</div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {club.memberRecruitmentNote}
          </p>
        </div>
      )}

      {/* 가입 문의 섹션 */}
      <div className="border border-border rounded-2xl bg-white p-6 mt-4">
        {!joinPost ? (
          <div>
            <div className="text-sm font-bold mb-3">가입 문의</div>
            <textarea
              className="w-full border-[1.5px] border-muted-foreground/30 bg-white rounded-xl p-3 text-sm font-[inherit] min-h-[96px] resize-y mb-3 transition-colors focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="가입 조건/분위기/참가 방식 등 궁금한 점을 자유롭게 작성해주세요."
              value={joinInquiryContent}
              onChange={(e) => setJoinInquiryContent(e.target.value)}
              disabled={actionLoading}
            />
            <button
              className={outlineBtnClass}
              onClick={handleCreateJoinInquiry}
              disabled={actionLoading || !joinInquiryContent.trim()}
              type="button"
            >
              문의 남기기
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm font-bold mb-3">대화</div>
            <div className="border border-border bg-white rounded-xl p-3 mb-3">
              <div className="text-sm">{sanitizeJoinInquiryText(joinPost.content)}</div>
              <div className="mt-1.5 text-xs text-muted-foreground">
                {joinPost.author?.name ?? joinPost.guestName ?? "익명"} ·{" "}
                {new Date(joinPost.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              {joinComments.length === 0 ? (
                <div className="text-xs text-muted-foreground leading-snug text-center py-2">
                  아직 댓글이 없습니다.
                </div>
              ) : (
                joinComments.map((c) => (
                  <div key={c.id} className="border border-border bg-white rounded-xl p-3 mb-3">
                    <div className="text-sm">{c.content}</div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {c.author?.name ?? "익명"} ·{" "}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <textarea
                className="w-full border-[1.5px] border-muted-foreground/30 bg-white rounded-xl p-3 text-sm font-[inherit] min-h-[72px] resize-y mb-3 transition-colors focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="댓글을 입력하세요"
                value={joinCommentContent}
                onChange={(e) => setJoinCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className={outlineBtnClass}
                onClick={handleCreateJoinComment}
                disabled={actionLoading || !joinCommentContent.trim()}
                type="button"
              >
                댓글 작성
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubRecruitingPage;
