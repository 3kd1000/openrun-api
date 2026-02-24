import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { scheduleService } from "../../../services/scheduleService";
import type { Schedule, Participant, MatchType } from "../../../types/schedule";
import {
  MapPinIcon,
  CalendarIcon,
} from "../../../components/common/Icons";
import { Link2, MessageCircle, Users } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { userService, type UserPublicProfile } from "../../../services/userService";
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

const ScheduleRecruitPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { scheduleId } = useParams<{ scheduleId: string }>();

  const sid = scheduleId ? Number(scheduleId) : NaN;

  const currentUserId = useMemo(() => {
    const session = getOpenRunSession();
    const raw = session.userId?.toString();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostProfile, setHostProfile] = useState<UserPublicProfile | null>(null);

  // schedule에서 clubId 추출
  const clubId = schedule?.clubId ?? null;
  const isPublic = clubId === null;
  const isHost = schedule?.createdByUserId != null && schedule.createdByUserId === currentUserId;

  const isConfirmed =
    myParticipant?.status === "CONFIRMED" ||
    myParticipant?.status === "WAITING";

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
    if (!myParticipant) return "미신청";
    if (myParticipant.status === "PENDING") return "신청완료 (대기중)";
    if (myParticipant.status === "CONFIRMED") return "참가 확정";
    if (myParticipant.status === "WAITING") return "대기중";
    if (myParticipant.status === "REJECTED") return "반려됨";
    if (myParticipant.status === "CANCELLED") return "신청취소";
    return myParticipant.status;
  }, [myParticipant]);

  const statusTone = useMemo(() => {
    if (!myParticipant) return "neutral";
    if (myParticipant.status === "PENDING") return "pending";
    if (myParticipant.status === "CONFIRMED") return "success";
    if (myParticipant.status === "WAITING") return "pending";
    if (myParticipant.status === "REJECTED") return "danger";
    return "neutral";
  }, [myParticipant]);

  const statusToneClass = {
    neutral: "text-muted-foreground",
    pending: "text-yellow-700",
    success: "text-green-700",
    danger: "text-red-700",
  }[statusTone];

  const load = async () => {
    if (!Number.isFinite(sid)) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scheduleData = await scheduleService.getScheduleById(sid);
      setSchedule(scheduleData);

      // 내 신청 상태 조회 (공개/클럽 공통)
      if (currentUserId) {
        try {
          const participant = await scheduleService.getMyParticipant(sid, currentUserId);
          setMyParticipant(participant);
        } catch {
          setMyParticipant(null);
        }
      }

      // 호스트 프로필 조회 (공개일정/클럽일정 공통)
      if (scheduleData.createdByUserId) {
        try {
          const profile = await userService.getUserPublicProfile(scheduleData.createdByUserId);
          setHostProfile(profile);
        } catch {
          setHostProfile(null);
        }
      }
    } catch (e) {
      console.error(e);
      setError("모집 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

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
    if (!currentUserId || !Number.isFinite(sid)) return;
    try {
      setActionLoading(true);
      const participant = await scheduleService.requestJoinSchedule(sid, currentUserId);
      setMyParticipant(participant);
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
    if (!currentUserId || !Number.isFinite(sid)) return;
    if (!confirm("신청을 취소하시겠습니까?")) return;
    try {
      setActionLoading(true);
      await scheduleService.cancelParticipantRequest(sid, currentUserId);
      setMyParticipant(null);
      showToast("신청이 취소되었습니다", "success");
    } catch (e) {
      console.error(e);
      showToast("취소에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // CONFIRMED/WAITING 상태의 참가 취소 (카운터 감소 포함)
  const handleCancelParticipation = async () => {
    if (requireLogin()) return;
    if (!currentUserId || !Number.isFinite(sid)) return;
    if (!confirm("참가를 취소하시겠습니까?")) return;
    try {
      setActionLoading(true);
      await scheduleService.cancelParticipation(sid, currentUserId);
      setMyParticipant(null);
      showToast("참가가 취소되었습니다", "success");
    } catch (e) {
      console.error(e);
      showToast("취소에 실패했습니다", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container p-4">
        <div className="py-6 text-muted-foreground text-center">로딩 중...</div>
      </div>
    );
  }

  // 배너 표시 정보
  const bannerTitle = isPublic ? "공개일정" : (schedule?.clubName ?? "클럽");
  const bannerBgClass = isPublic ? "bg-primary" : "bg-slate-700";
  const recruitNote = isPublic ? schedule?.description : schedule?.guestRecruitNote;

  // 테마 색상 (공개: 에메랄드, 클럽: 차콜)
  const accentBg = isPublic ? "bg-primary" : "bg-slate-700";
  const accentBgHover = isPublic ? "hover:bg-primary/90" : "hover:bg-slate-600";
  const accentText = isPublic ? "text-primary" : "text-slate-700";
  const accentBorder = isPublic ? "border-primary" : "border-slate-700";
  const accentBgLight = isPublic ? "hover:bg-primary/5" : "hover:bg-slate-50";

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="relative flex items-center justify-between py-2 mb-3">
        <BackButton onClick={handleBack} />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-foreground pointer-events-none">
          {isPublic ? "일정 정보" : "게스트 모집"}
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
          {/* 배너 */}
          <div className={`${bannerBgClass} px-6 pt-6 pb-5`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white leading-tight break-words flex-1 min-w-0">
                {bannerTitle}
              </h2>
              {/* 클럽일정: 클럽 보기 버튼 */}
              {!isPublic && clubId && (
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 text-sm text-white font-medium cursor-pointer transition-colors hover:bg-white/30 border-none"
                  onClick={() =>
                    navigate(`/clubs/${clubId}/recruiting`, {
                      state: { from: "guest-recruit" },
                    })
                  }
                >
                  클럽 보기 &gt;
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {schedule.courtName && (
                <span className="inline-flex items-center gap-1 text-sm text-white/85">
                  <MapPinIcon size={14} color="currentColor" />
                  {schedule.courtName}
                </span>
              )}
              {/* 공개일정: 주소/지역 추가 표시 */}
              {isPublic && (schedule.courtAddress || schedule.region) && (
                <span className="inline-flex items-center gap-1 text-sm text-white/85">
                  {schedule.courtAddress || schedule.region}
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
            {schedule.matchType && schedule.matchType !== "NONE" ? (
              <div className="flex flex-col items-center py-4">
                <span className="text-xs text-muted-foreground mb-1">모임타입</span>
                <span className="text-lg font-bold text-foreground">
                  {getMatchTypeLabel(schedule.matchType)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <span className="text-xs text-muted-foreground mb-1">모임타입</span>
                <span className="text-lg font-bold text-muted-foreground">-</span>
              </div>
            )}
          </div>

          {/* 신청 상태 + CTA 3버튼 (공개/클럽 통일, 항상 노출) */}
          <div className="px-6 py-5 space-y-3">
            {/* 신청 상태 */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">신청상태</span>
              <span className={`text-sm font-bold whitespace-nowrap ${statusToneClass}`}>
                {statusLabel}
              </span>
            </div>

            {/* 1. 신청하기 / 신청취소 / 참가취소 (항상 노출) */}
            {myParticipant?.status === "PENDING" ? (
              <button
                className="w-full rounded-xl py-3 text-sm font-bold cursor-pointer transition-all border-[1.5px] border-red-500 bg-transparent text-red-600 hover:bg-red-50 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancel}
                disabled={actionLoading}
                type="button"
              >
                신청취소
              </button>
            ) : isConfirmed ? (
              <button
                className="w-full rounded-xl py-3 text-sm font-bold cursor-pointer transition-all border-[1.5px] border-red-500 bg-transparent text-red-600 hover:bg-red-50 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancelParticipation}
                disabled={actionLoading}
                type="button"
              >
                참가취소
              </button>
            ) : (
              <button
                className={`w-full rounded-xl py-3 text-sm font-bold ${accentBg} text-white cursor-pointer transition-all ${accentBgHover} hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleApply}
                disabled={actionLoading || isHost}
                type="button"
              >
                {myParticipant?.status === "REJECTED" ? "다시 신청하기" : "신청하기"}
              </button>
            )}

            {/* 2. 일정 상세 보기 (항상 활성) */}
            <button
              className={`w-full rounded-xl py-3 text-sm font-bold cursor-pointer transition-all border-[1.5px] ${accentBorder} bg-transparent ${accentText} ${accentBgLight} hover:-translate-y-px`}
              onClick={() =>
                navigate(`/schedules/${sid}`, {
                  state: { returnUrl: location.pathname },
                })
              }
              type="button"
            >
              일정 상세 보기
            </button>
          </div>
        </div>
      )}

      {/* 모집 안내 / 일정 설명 */}
      {recruitNote && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className={`text-sm font-bold mb-3 ${isPublic ? "text-primary" : "text-slate-700"}`}>
            {isPublic ? "일정 안내" : "모집 안내"}
          </div>
          <div className="w-full p-4 bg-slate-100 rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {recruitNote}
          </div>
        </div>
      )}

      {/* 호스트/담당자 정보 */}
      {hostProfile && (
        <div className="border border-border rounded-2xl bg-white p-6 mt-4">
          <div className={`text-sm font-bold mb-4 ${isPublic ? "text-primary" : "text-slate-700"}`}>
            호스트 정보
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이름</span>
              <span className="text-sm font-medium text-foreground">
                {hostProfile.displayName}
              </span>
            </div>
            {hostProfile.region && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">지역</span>
                <span className="text-sm font-medium text-foreground">
                  {hostProfile.region}
                </span>
              </div>
            )}
            {isPublic && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">공개일정 개설</span>
                <span className="text-sm font-medium text-foreground">
                  {hostProfile.publicScheduleCount}회
                </span>
              </div>
            )}
          </div>
          {/* 메시지 보내기 (항상 노출, 호스트 시 disabled) */}
          <button
            className={`w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold border-[1.5px] ${accentBorder} bg-transparent ${accentText} cursor-pointer transition-all ${accentBgLight} hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => {
              if (!currentUserId) {
                if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
                  sessionStorage.setItem("returnUrl", location.pathname);
                  navigate("/login");
                }
                return;
              }
              navigate(`/messages/${hostProfile.id}`, {
                state: {
                  referenceType: isPublic ? "PUBLIC_SCHEDULE" : "CLUB_SCHEDULE",
                  referenceId: sid,
                  returnUrl: location.pathname,
                },
              });
            }}
            disabled={isHost}
            type="button"
          >
            <MessageCircle size={16} />
            {isPublic ? "호스트에게 메시지 보내기" : "담당자에게 메시지 보내기"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleRecruitPage;
