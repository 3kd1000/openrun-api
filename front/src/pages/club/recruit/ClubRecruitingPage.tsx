import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { LinkIcon } from "../../../components/common/Icons";
import BackButton from "../../../components/common/BackButton";
import {
  clubService,
  type ExternalRequestResponse,
} from "../../../services/clubService";
import { postService } from "../../../services/postService";
import { commentService } from "../../../services/commentService";
import type { Post, Comment } from "../../../types/post";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { syncClubList } from "../../../services/api/userApi";
import { useToast } from "../../../contexts/ToastContext";
import "./ClubRecruitingPage.css";

const ClubRecruitingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    if (!currentUserId) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }
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
    if (!currentUserId) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }
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
    if (!currentUserId) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }
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

  if (loading) return <div>Loading...</div>;
  if (!club) return <div>Club not found</div>;

  return (
    <div className="club-recruiting-page">
      <div className="club-recruiting-page__header">
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
        <h1 className="club-recruiting-page__title">클럽소개</h1>
        <button
          className="club-recruiting-page__link-btn"
          type="button"
          onClick={async () => {
            const url = `${window.location.origin}/clubs/${clubId}/recruiting`;
            try {
              await navigator.clipboard.writeText(url);
              showToast("초대링크가 복사되었습니다", "success");
            } catch {
              prompt("아래 링크를 복사하세요:", url);
            }
          }}
          aria-label="초대링크 복사"
          title="초대링크 복사"
        >
          <LinkIcon size={20} />
          <span>초대링크복사</span>
        </button>
      </div>

      <div className="club-recruiting-page__card">
        <div className="club-recruiting-page__info-list">
          {/* 클럽명 */}
          <div className="club-recruiting-page__info-item">
            <span className="club-recruiting-page__info-label">클럽명</span>
            <span className="club-recruiting-page__info-value">
              {club.name}
            </span>
          </div>

          {/* 활동지역 */}
          <div className="club-recruiting-page__info-item">
            <span className="club-recruiting-page__info-label">활동지역</span>
            <span className={`club-recruiting-page__info-value ${!club.region ? "club-recruiting-page__info-value--muted" : ""}`}>
              {club.region || "-"}
            </span>
          </div>

          {/* 멤버 수 */}
          <div className="club-recruiting-page__info-item">
            <span className="club-recruiting-page__info-label">멤버 수</span>
            <span className="club-recruiting-page__info-value">
              {club.memberCount ?? 0}명
            </span>
          </div>

          {/* 클럽소개 */}
          <div className="club-recruiting-page__info-item">
            <span className="club-recruiting-page__info-label">클럽소개</span>
            <span className={`club-recruiting-page__info-value ${!club.description ? "club-recruiting-page__info-value--muted" : ""}`}>
              {club.description || "-"}
            </span>
          </div>

          {/* 활동 현황 */}
          {club.activitySummary && (
            <div className="club-recruiting-page__info-item">
              <span className="club-recruiting-page__info-label">활동 현황</span>
              <span className="club-recruiting-page__info-value club-recruiting-page__info-value--highlight">
                {club.activitySummary}
              </span>
            </div>
          )}

          {/* 모집 안내글 */}
          {club.memberRecruitmentOpen && club.memberRecruitmentNote && (
            <div className="club-recruiting-page__info-item club-recruiting-page__info-item--block">
              <span className="club-recruiting-page__info-label">모집 안내</span>
              <div className="club-recruiting-page__recruit-content">
                {club.memberRecruitmentNote}
              </div>
            </div>
          )}
        </div>

        <div className="club-recruiting-page__divider" />

        <div className="club-recruiting-page__actions">
          {joinStatus === "ACTIVE" && (
            <button
              className="club-recruiting-page__join-btn"
              disabled
              type="button"
            >
              이미 가입된 클럽입니다.
            </button>
          )}
          {joinStatus === "PENDING" && (
            <button
              className="club-recruiting-page__join-btn"
              disabled
              type="button"
            >
              가입 대기중
            </button>
          )}
          {joinStatus === "NONE" && (
            <button
              className="club-recruiting-page__join-btn"
              onClick={handleJoinRequest}
              type="button"
            >
              가입 신청
            </button>
          )}

          <div className="club-recruiting-page__hint">
            가입 문의는 운영진이 확인 후 댓글로 답변합니다.
          </div>
        </div>
      </div>

      <div className="club-recruiting-page__card club-recruiting-page__card--thread">
        {!joinPost ? (
          <div className="club-recruiting-page__section">
            <div className="club-recruiting-page__section-title">가입 문의</div>
            <textarea
              className="club-recruiting-page__textarea"
              placeholder={
                "가입 조건/분위기/참가 방식 등 궁금한 점을 자유롭게 작성해주세요."
              }
              value={joinInquiryContent}
              onChange={(e) => setJoinInquiryContent(e.target.value)}
              disabled={actionLoading}
            />
            <button
              className="club-recruiting-page__primary"
              onClick={handleCreateJoinInquiry}
              disabled={actionLoading || !joinInquiryContent.trim()}
              type="button"
            >
              문의 남기기
            </button>
          </div>
        ) : (
          <div className="club-recruiting-page__section">
            <div className="club-recruiting-page__section-title">대화</div>
            <div className="club-recruiting-page__post">
              <div className="club-recruiting-page__post-content">
                {sanitizeJoinInquiryText(joinPost.content)}
              </div>
              <div className="club-recruiting-page__post-meta">
                {joinPost.author?.name ?? joinPost.guestName ?? "익명"} ·{" "}
                {new Date(joinPost.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="club-recruiting-page__comments">
              {joinComments.length === 0 ? (
                <div className="club-recruiting-page__hint">
                  아직 댓글이 없습니다.
                </div>
              ) : (
                joinComments.map((c) => (
                  <div key={c.id} className="club-recruiting-page__comment">
                    <div className="club-recruiting-page__comment-content">
                      {c.content}
                    </div>
                    <div className="club-recruiting-page__comment-meta">
                      {c.author?.name ?? "익명"} ·{" "}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="club-recruiting-page__comment-box">
              <textarea
                className="club-recruiting-page__textarea club-recruiting-page__textarea--comment"
                placeholder="댓글을 입력하세요"
                value={joinCommentContent}
                onChange={(e) => setJoinCommentContent(e.target.value)}
                disabled={actionLoading}
              />
              <button
                className="club-recruiting-page__primary"
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
