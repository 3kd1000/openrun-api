import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Link2,
  Pin,
  Users,
  Swords,
  Pencil,
} from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import { clubService } from "../../../services/clubService";
import type { UserResponse } from "../../../services/userService";
import type {
  Schedule,
  CreateScheduleRequest,
  Participant,
  MatchType,
} from "../../../types/schedule";
import DrawCreateModal from "../draw/DrawCreateModal";
import DrawViewModal from "../draw/DrawViewModal";
import ParticipantManagementModal from "../edit/ParticipantManagementModal";
import ScheduleFormSection from "../edit/ScheduleFormSection";
import ScheduleBallUsageSection from "../../../components/ball/ScheduleBallUsageSection";
import {
  validateParticipation,
  validateScheduleCreation,
  isPastDate,
} from "../../../utils/scheduleValidation";
import { isNotEmpty } from "../../../utils/isEmpty";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import UserNameWithBadge from "../../../components/common/UserNameWithBadge";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import { FEATURE_FLAGS } from "../../../config/featureFlags";

const matchTypeLabels: Record<string, string> = {
  MEN_DOUBLES: "남복",
  WOMEN_DOUBLES: "여복",
  MIXED_DOUBLES: "혼복",
  SINGLES: "단식",
  NONE: "",
};

export default function ScheduleDetailPage() {
  const { scheduleId: scheduleIdParam } = useParams<{
    scheduleId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const returnUrl =
    (location.state as { returnUrl?: string })?.returnUrl || "/schedules/club";
  const scheduleId = scheduleIdParam ? parseInt(scheduleIdParam) : 0;

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipation, setMyParticipation] = useState<Participant | null>(
    null
  );
  const [clubMembers, setClubMembers] = useState<UserResponse[]>([]);

  // 모집 관련 상태
  const [guestRecruitNote, setGuestRecruitNote] = useState("");
  const [interclubRecruitNote, setInterclubRecruitNote] = useState("");
  const [editingRecruitType, setEditingRecruitType] = useState<
    "guest" | "interclub" | null
  >(null);
  const [tempRecruitNote, setTempRecruitNote] = useState("");

  // 자식 모달 상태
  const [showDrawCreateModal, setShowDrawCreateModal] = useState(false);
  const [showDrawViewModal, setShowDrawViewModal] = useState(false);
  const [showParticipantManagementModal, setShowParticipantManagementModal] =
    useState(false);

  // 편집 모드용 폼 데이터
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    clubId: 0,
    courtName: "",
    maxCapacity: 0,
    cost: undefined as number | undefined,
    description: "",
    reservedByUserId: undefined as number | undefined,
    matchType: null as MatchType | null,
  });

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;
  const canDelete = schedule?.canManageSchedule ?? false;
  const isLoadingRef = useRef(false);

  const isHost = schedule?.createdByUserId != null && schedule.createdByUserId === currentUserId;

  // 데이터 로드
  const loadScheduleAndParticipants = useCallback(async () => {
    if (isLoadingRef.current || !scheduleId) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      const [scheduleData, participantsList, myStatus] = await Promise.all([
        scheduleService.getScheduleById(
          scheduleId,
          currentUserId || undefined
        ),
        participantService.getParticipants(scheduleId),
        currentUserId
          ? participantService.getMyParticipation(scheduleId, currentUserId)
          : Promise.resolve(null),
      ]);

      setSchedule(scheduleData);
      setParticipants(participantsList);
      setMyParticipation(myStatus);
      setGuestRecruitNote(scheduleData.guestRecruitNote ?? "");
      setInterclubRecruitNote(scheduleData.interclubRecruitNote ?? "");

      const scheduledAt = new Date(scheduleData.scheduledAt);
      setSelectedDate(format(scheduledAt, "yyyy-MM-dd"));
      setSelectedTime(format(scheduledAt, "HH:mm"));
      setFormData({
        clubId: scheduleData.clubId ?? 0,
        courtName: scheduleData.courtName,
        maxCapacity: scheduleData.maxCapacity,
        cost: scheduleData.cost || undefined,
        description: scheduleData.description || "",
        reservedByUserId: scheduleData.reservedByUserId || undefined,
        matchType: scheduleData.matchType || null,
      });
    } catch (err) {
      console.error("일정 정보 로드 실패:", err);
      setError("일정 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [scheduleId, currentUserId]);

  useEffect(() => {
    loadScheduleAndParticipants();
  }, [loadScheduleAndParticipants]);

  // 참가자 관리 모달용 클럽 회원 조회
  useEffect(() => {
    if (!showParticipantManagementModal) return;
    if (schedule?.clubId === null) {
      setClubMembers([]);
      return;
    }
    const fetchClubMembers = async () => {
      try {
        const sess = getOpenRunSession();
        const currentClubId = parseInt(sess.currentClubId ?? "1");
        const members = await clubService.getClubMembers(currentClubId);
        setClubMembers(members);
      } catch (err) {
        console.error("클럽 회원 목록 조회 실패:", err);
      }
    };
    fetchClubMembers();
  }, [showParticipantManagementModal, schedule]);

  const handleGoBack = () => {
    navigate(returnUrl);
  };

  // 링크 복사
  const handleCopyLink = async () => {
    if (!schedule) return;
    const url = `${window.location.origin}/schedules/club?scheduleId=${schedule.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었습니다", "success");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("링크가 복사되었습니다", "success");
    }
  };

  // 핀 토글
  const handleTogglePinned = async () => {
    if (!schedule || !currentUserId) return;
    try {
      setLoading(true);
      setError("");
      const updated = await scheduleService.updateSchedulePinned(
        schedule.id,
        !schedule.pinned,
        currentUserId
      );
      setSchedule(updated);
    } catch (err) {
      console.error("PIN 설정 실패:", err);
      setError("PIN 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 게스트 모집 토글
  const handleToggleGuestRecruit = async () => {
    if (!schedule || !currentUserId) return;
    const currentOpen = schedule.guestRecruitOpen === true;

    if (!currentOpen) {
      setEditingRecruitType("guest");
      setTempRecruitNote(guestRecruitNote);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const updated = await scheduleService.updateGuestRecruit(
        schedule.id,
        false,
        currentUserId,
        schedule.guestRecruitNote || null
      );
      setSchedule(updated);
      setEditingRecruitType(null);
    } catch (err) {
      console.error("게스트 모집 설정 실패:", err);
      setError("게스트 모집 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 교류전 모집 토글
  const handleToggleInterclubRecruit = async () => {
    if (!schedule || !currentUserId) return;
    const currentOpen = schedule.interclubRecruitOpen === true;

    if (!currentOpen) {
      setEditingRecruitType("interclub");
      setTempRecruitNote(interclubRecruitNote);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const updated = await scheduleService.updateInterclubRecruit(
        schedule.id,
        false,
        currentUserId,
        schedule.interclubRecruitNote || null
      );
      setSchedule(updated);
      setEditingRecruitType(null);
    } catch (err) {
      console.error("교류전 모집 설정 실패:", err);
      setError("교류전 모집 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모집 메시지 등록
  const handleSubmitRecruitNote = async () => {
    if (!schedule || !currentUserId || !editingRecruitType) return;
    try {
      setLoading(true);
      setError("");
      if (editingRecruitType === "guest") {
        const updated = await scheduleService.updateGuestRecruit(
          schedule.id,
          true,
          currentUserId,
          tempRecruitNote || null
        );
        setSchedule(updated);
        setGuestRecruitNote(updated.guestRecruitNote ?? "");
      } else {
        const updated = await scheduleService.updateInterclubRecruit(
          schedule.id,
          true,
          currentUserId,
          tempRecruitNote || null
        );
        setSchedule(updated);
        setInterclubRecruitNote(updated.interclubRecruitNote ?? "");
      }
      setEditingRecruitType(null);
      setTempRecruitNote("");
    } catch (err) {
      console.error("모집글 등록 실패:", err);
      setError("모집글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 참가 신청
  const handleJoin = async () => {
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }
    if (!schedule) return;

    const validation = validateParticipation(
      schedule.scheduledAt,
      schedule.participationStartAt
    );
    if (!validation.isValid) {
      setError(validation.errorMessage || "참가 신청에 실패했습니다.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (schedule.clubId === null) {
        // 공개일정: 항상 PENDING → 호스트 승인 플로우
        await participantService.requestJoinPublicSchedule(schedule.id, currentUserId);
        showToast("참가 신청이 완료되었습니다. 호스트 승인을 기다려주세요.", "success");
      } else {
        // 클럽일정: 클럽원은 직접 참가, 비클럽원은 PENDING 플로우
        try {
          await participantService.joinSchedule(schedule.id, currentUserId);
          showToast("참가 신청이 완료되었습니다", "success");
        } catch (joinErr: unknown) {
          // 비클럽원(게스트)이 클럽일정에 참가 시도 → 게스트 모집 열려있으면 PENDING 플로우로 전환
          if (schedule.guestRecruitOpen) {
            await participantService.requestJoinPublicSchedule(schedule.id, currentUserId);
            showToast("참가 신청이 완료되었습니다. 호스트 승인을 기다려주세요.", "success");
          } else {
            throw joinErr;
          }
        }
      }
      await loadScheduleAndParticipants();
    } catch (err: unknown) {
      console.error("참가 신청 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "참가 신청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 참가 취소
  const handleCancel = async () => {
    if (!currentUserId || !schedule) return;
    if (!window.confirm("참가 신청을 취소하시겠습니까?")) return;

    try {
      setLoading(true);
      setError("");
      await participantService.cancelParticipation(schedule.id, currentUserId);
      await loadScheduleAndParticipants();
    } catch (err) {
      console.error("신청 취소 실패:", err);
      setError("신청 취소에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 일정 삭제
  const handleDelete = async () => {
    if (!schedule) return;
    if (!window.confirm("정말 이 일정을 삭제하시겠습니까?")) return;

    try {
      setLoading(true);
      setError("");
      await scheduleService.deleteSchedule(
        schedule.id,
        currentUserId ?? undefined
      );
      navigate(returnUrl);
    } catch (err) {
      console.error("일정 삭제 실패:", err);
      setError("일정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 대진표 삭제
  const handleDeleteDraw = async () => {
    if (!schedule) return;
    if (
      !window.confirm(
        "대진표를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
      )
    )
      return;

    try {
      setLoading(true);
      setError("");
      await scheduleService.deleteDraw(schedule.id);
      await loadScheduleAndParticipants();
    } catch (err) {
      console.error("대진표 삭제 실패:", err);
      setError("대진표 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 참가자 승인 (호스트)
  const handleApprove = async (participantId: number) => {
    if (!currentUserId || !schedule) return;
    try {
      setLoading(true);
      await participantService.approveParticipant(schedule.id, participantId, currentUserId);
      await loadScheduleAndParticipants();
    } catch (err) {
      console.error("승인 실패:", err);
      setError("참가자 승인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 참가자 거절 (호스트)
  const handleReject = async (participantId: number) => {
    if (!currentUserId || !schedule) return;
    try {
      setLoading(true);
      await participantService.rejectParticipant(schedule.id, participantId, currentUserId);
      await loadScheduleAndParticipants();
    } catch (err) {
      console.error("거절 실패:", err);
      setError("참가자 거절에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드 저장
  const handleEditSubmit = async (data: {
    clubId?: number;
    scheduledAt: string;
    durationMinutes: number;
    courtName: string;
    maxCapacity: number;
    numberOfCourts?: number;
    cost?: number;
    description: string;
    reservedByUserId?: number;
    participationStartAt: string | null;
    matchType?: MatchType;
  }) => {
    if (!schedule) {
      setError("일정 정보를 불러오는 중입니다.");
      throw new Error("일정 정보를 불러오는 중입니다.");
    }

    const validation = validateScheduleCreation(data.scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "일정 수정에 실패했습니다.");
      throw new Error(
        validation.errorMessage || "일정 수정에 실패했습니다."
      );
    }

    if (data.participationStartAt) {
      const scheduledDate = new Date(data.scheduledAt);
      const participationStartDate = new Date(data.participationStartAt);
      if (participationStartDate >= scheduledDate) {
        setError("참가신청 시작시간은 일정 시간보다 이전이어야 합니다.");
        throw new Error(
          "참가신청 시작시간은 일정 시간보다 이전이어야 합니다."
        );
      }
    }

    setLoading(true);
    setError("");

    try {
      const requestData: CreateScheduleRequest = {
        clubId: data.clubId!,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        courtName: data.courtName,
        maxCapacity: data.maxCapacity,
        numberOfCourts: data.numberOfCourts || undefined,
        cost: data.cost,
        description: data.description,
        reservedByUserId: data.reservedByUserId,
        participationStartAt: data.participationStartAt,
        matchType: data.matchType,
      };

      await scheduleService.updateSchedule(
        schedule.id,
        requestData,
        currentUserId ?? undefined
      );
      setIsEditMode(false);
      await loadScheduleAndParticipants();
    } catch (err) {
      console.error("일정 수정 실패:", err);
      setError("일정 수정에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmedParticipants = participants.filter(
    (p) => p.status === "CONFIRMED"
  );
  const waitingParticipants = participants.filter(
    (p) => p.status === "WAITING"
  );
  const pendingParticipants = participants.filter(
    (p) => p.status === "PENDING"
  );

  // 로딩 상태
  if (loading && !schedule) {
    return (
      <div className="page-container">
        <div className="relative mb-4 flex items-center py-1">
          <BackButton onClick={handleGoBack} />
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pointer-events-none">일정 상세</span>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (!schedule) {
    return (
      <div className="page-container">
        <div className="relative mb-4 flex items-center py-1">
          <BackButton onClick={handleGoBack} />
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pointer-events-none">일정 상세</span>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
          {error || "일정 정보를 불러오는데 실패했습니다."}
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={handleGoBack}
        >
          돌아가기
        </Button>
      </div>
    );
  }

  // 편집 모드
  if (isEditMode) {
    return (
      <div className="page-container">
        <div className="mb-4 flex items-center gap-2">
          <BackButton onClick={() => setIsEditMode(false)} />
          <span className="text-sm font-semibold">일정 수정</span>
        </div>
        <ScheduleFormSection
          mode="update"
          currentUserId={currentUserId}
          initialData={{
            clubId: schedule.clubId ?? 0,
            scheduledAt: `${selectedDate}T${selectedTime}:00`,
            durationMinutes: schedule.durationMinutes || 120,
            courtName: formData.courtName,
            maxCapacity: formData.maxCapacity,
            numberOfCourts: schedule.numberOfCourts || undefined,
            cost: formData.cost,
            description: formData.description,
            reservedByUserId: formData.reservedByUserId,
            participationStartAt: schedule.participationStartAt || null,
            matchType: formData.matchType,
          }}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditMode(false)}
          loading={loading}
          error={error}
          submitButtonText="저장"
        />
      </div>
    );
  }

  // 뷰 모드 (메인)
  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="relative mb-4 flex items-center py-1">
        <BackButton onClick={handleGoBack} />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pointer-events-none">일정 상세</span>
        <Button variant="outline" size="sm" className="text-xs ml-auto" onClick={handleCopyLink}>
          <Link2 size={14} className="mr-1" />
          링크복사
        </Button>
      </div>

      {/* 관리자 토글 버튼 (클럽일정만) */}
      {canDelete && schedule.clubId !== null && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs",
              schedule.pinned
                ? "border-slate-400 bg-slate-50 text-slate-700"
                : "text-muted-foreground"
            )}
            onClick={handleTogglePinned}
            disabled={loading}
          >
            <Pin size={14} className="mr-1" />
            고정 {schedule.pinned ? "ON" : "OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs",
              schedule.guestRecruitOpen
                ? "border-slate-400 bg-slate-50 text-slate-700"
                : "text-muted-foreground"
            )}
            onClick={handleToggleGuestRecruit}
            disabled={loading}
          >
            <Users size={14} className="mr-1" />
            게스트 {schedule.guestRecruitOpen ? "ON" : "OFF"}
          </Button>
          {FEATURE_FLAGS.INTERCLUB_ENABLED && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs",
                schedule.interclubRecruitOpen
                  ? "border-slate-400 bg-slate-50 text-slate-700"
                  : "text-muted-foreground"
              )}
              onClick={handleToggleInterclubRecruit}
              disabled={loading}
            >
              <Swords size={14} className="mr-1" />
              교류전 {schedule.interclubRecruitOpen ? "ON" : "OFF"}
            </Button>
          )}
        </div>
      )}

      {/* 모집 메시지 입력 */}
      {editingRecruitType && (
        <Card className="mb-3 gap-0 py-0">
          <CardContent className="p-3">
            <label className="mb-1 block text-sm font-medium">
              {editingRecruitType === "guest" ? "게스트" : "교류전"} 모집 메시지
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={
                editingRecruitType === "guest"
                  ? "예시) NTRP 3.5 이상, 구력 2년 이상 환영\n주차 가능, 라켓 대여 불가"
                  : "예시) 4vs4 교류전 예정 (오후 2시~6시)\n평균 구력 3년, 복식 중심"
              }
              value={tempRecruitNote}
              onChange={(e) => setTempRecruitNote(e.target.value)}
              disabled={loading}
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingRecruitType(null);
                  setTempRecruitNote("");
                }}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitRecruitNote}
                disabled={loading}
              >
                등록
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 일정 정보 카드 */}
      <Card className="mb-3 gap-0 py-0">
        <CardContent className="space-y-3 p-4">
          {/* 일정 구분 배지 */}
          <div className="flex items-center gap-2">
            {schedule.clubId !== null ? (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                클럽일정
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                공개일정
              </Badge>
            )}
            {schedule.clubName && (
              <span className="text-sm text-muted-foreground">{schedule.clubName}</span>
            )}
          </div>

          {/* 코트명 + 코트수 */}
          <div>
            <span className="text-xs text-muted-foreground">코트명</span>
            <p className="text-sm font-medium">
              {schedule.courtName}
              {schedule.numberOfCourts != null &&
                schedule.numberOfCourts >= 1 && (
                  <span className="ml-1 text-muted-foreground">
                    ({schedule.numberOfCourts}면)
                  </span>
                )}
            </p>
          </div>

          {/* 주소 (공개 일정에서 courtAddress가 있는 경우) */}
          {schedule.courtAddress && (
            <div>
              <span className="text-xs text-muted-foreground">주소</span>
              <p className="text-sm font-medium">{schedule.courtAddress}</p>
            </div>
          )}

          {/* 일정 시간 */}
          <div>
            <span className="text-xs text-muted-foreground">일정 시간</span>
            <p className="text-sm font-medium">
              {formatScheduleDateTime(
                schedule.scheduledAt,
                schedule.durationMinutes
              )}
            </p>
          </div>

          {/* 참가신청 시작 시간 */}
          {schedule.participationStartAt && (
            <div>
              <span className="text-xs text-muted-foreground">신청 시작</span>
              <p className="text-sm font-medium">
                {format(new Date(schedule.participationStartAt), "yy'년' M'월' d'일('E')' HH:mm", { locale: ko })}
              </p>
            </div>
          )}

          {/* 모임타입 + 참가비용 */}
          {(schedule.matchType ||
            (isNotEmpty(schedule.cost) && schedule.cost !== undefined)) && (
            <div className="flex gap-6">
              {schedule.matchType && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    모임 타입
                  </span>
                  <p className="text-sm font-medium">
                    {matchTypeLabels[schedule.matchType] || ""}
                  </p>
                </div>
              )}
              {isNotEmpty(schedule.cost) && schedule.cost !== undefined && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    참가 비용
                  </span>
                  <p className="text-sm font-medium">
                    {schedule.cost.toLocaleString()}원
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 예약자 */}
          {schedule.reservedByUserName && (
            <div>
              <span className="text-xs text-muted-foreground">예약자</span>
              <p className="text-sm font-medium">
                {schedule.reservedByUserName}
              </p>
            </div>
          )}

          {/* 설명 */}
          {isNotEmpty(schedule.description) && (
            <div>
              <span className="text-xs text-muted-foreground">설명</span>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {schedule.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 대진표 섹션 */}
      <Card className="mb-3 gap-0 py-0">
        <CardContent className="p-4">
          <span className="text-xs text-muted-foreground">대진표 상태</span>
          {schedule.drawType ? (
            <div className="mt-1 flex items-center justify-between">
              <Badge
                className={cn(
                  "text-xs",
                  schedule.isDrawValid
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {schedule.isDrawValid ? "유효" : "무효"}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowDrawViewModal(true)}
                >
                  보기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={handleDeleteDraw}
                  disabled={loading || isPastDate(schedule.scheduledAt)}
                  title={
                    isPastDate(schedule.scheduledAt)
                      ? "이미 지난 경기에는 대진표를 삭제할 수 없습니다."
                      : undefined
                  }
                >
                  삭제
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">미생성</span>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => setShowDrawCreateModal(true)}
                disabled={schedule.maxCapacity < 4}
                title={
                  schedule.maxCapacity < 4
                    ? `대진 생성은 4인 이상 모임에서 가능합니다. (현재 총원: ${schedule.maxCapacity}명)`
                    : undefined
                }
              >
                생성
              </Button>
            </div>
          )}
          {!schedule.drawType && schedule.maxCapacity < 4 && (
            <p className="mt-1 text-xs text-muted-foreground">
              4인 이상 모임에서 가능 (현재 {schedule.maxCapacity}명)
            </p>
          )}
        </CardContent>
      </Card>

      {/* 참가자 목록 */}
      <Card className="mb-3 gap-0 py-0">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">참가자 목록</span>
              <p className="text-sm font-medium">
                총원 {schedule.maxCapacity}명
              </p>
            </div>
            {schedule.canManageSchedule && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowParticipantManagementModal(true)}
              >
                <Pencil size={14} className="mr-1" />
                참가자 수정
              </Button>
            )}
          </div>

          {confirmedParticipants.length > 0 && (
            <div>
              <div className="mb-3 text-xs font-semibold text-muted-foreground">
                확정 ({confirmedParticipants.length}명)
              </div>
              <div className="grid grid-cols-2 gap-1">
                {confirmedParticipants.map((p, idx) => (
                  <div key={p.id} className="text-sm">
                    {idx + 1}.{" "}
                    <UserNameWithBadge
                      userId={p.userId}
                      userName={p.userName}
                      awardTypes={p.awardTypes}
                    />
                    {(p.asGuest || p.userId === null) && (
                      <Badge
                        variant="outline"
                        className="ml-1 text-[10px] text-gray-500"
                      >
                        게스트
                      </Badge>
                    )}
                    {p.userId != null && p.userId === currentUserId && (
                      <span className="ml-1 text-xs text-primary">(나)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {waitingParticipants.length > 0 && (
            <div className={cn(confirmedParticipants.length > 0 && "mt-3 border-t pt-3")}>
              <div className="mb-3 text-xs font-semibold text-gray-500">
                대기 ({waitingParticipants.length}명)
              </div>
              <div className="grid grid-cols-2 gap-1">
                {waitingParticipants.map((p, idx) => (
                  <div key={p.id} className="text-sm text-gray-600">
                    {idx + 1}.{" "}
                    <UserNameWithBadge
                      userId={p.userId}
                      userName={p.userName}
                      awardTypes={p.awardTypes}
                    />
                    {(p.asGuest || p.userId === null) && (
                      <Badge
                        variant="outline"
                        className="ml-1 text-[10px] text-gray-500"
                      >
                        게스트
                      </Badge>
                    )}
                    {p.userId != null && p.userId === currentUserId && (
                      <span className="ml-1 text-xs text-primary">(나)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 승인 대기 섹션 (공개 일정) */}
          {pendingParticipants.length > 0 && (
            <div className={cn((confirmedParticipants.length > 0 || waitingParticipants.length > 0) && "mt-3 border-t pt-3")}>
              <div className="mb-3 text-xs font-semibold text-amber-600">
                승인 대기 ({pendingParticipants.length}명)
              </div>
              <div className="grid grid-cols-2 gap-1">
                {pendingParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 text-sm text-foreground">
                    <span>{p.userName}</span>
                    {isHost && (
                      <div className="flex gap-1 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto px-1.5 py-0.5 text-xs text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleApprove(p.id)}
                          disabled={loading}
                        >
                          승인
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto px-1.5 py-0.5 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleReject(p.id)}
                          disabled={loading}
                        >
                          거절
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {participants.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              아직 참가자가 없습니다
            </p>
          )}
        </CardContent>
      </Card>

      {/* 공용구 섹션 (클럽 일정에서만 표시) */}
      {schedule.clubId != null && (
        <Card className="mb-3 gap-0 py-0 overflow-hidden">
          <CardContent className="p-4">
            <ScheduleBallUsageSection
              clubId={schedule.clubId}
              scheduleId={schedule.id}
            />
          </CardContent>
        </Card>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {currentUserId && myParticipation ? (
          <Button
            className="flex-1 bg-red-500 text-white hover:bg-red-600 border-red-500"
            onClick={handleCancel}
            disabled={loading || isPastDate(schedule.scheduledAt)}
            title={
              isPastDate(schedule.scheduledAt)
                ? "이미 지난 일정에는 신청 취소할 수 없습니다."
                : undefined
            }
          >
            {loading ? "취소 중..." : "신청취소"}
          </Button>
        ) : (
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleJoin}
            disabled={
              loading ||
              !currentUserId ||
              !schedule ||
              !validateParticipation(
                schedule.scheduledAt,
                schedule.participationStartAt
              ).isValid
            }
          >
            {loading ? "신청 중..." : "참가신청"}
          </Button>
        )}

        <Button
          variant="outline"
          className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
          onClick={handleDelete}
          disabled={loading || !canDelete}
          title={
            !canDelete
              ? "관리자만 일정을 삭제할 수 있습니다."
              : undefined
          }
        >
          삭제하기
        </Button>

        <Button
          className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
          onClick={() => {
            if (isPastDate(schedule.scheduledAt)) {
              setError("과거 날짜에는 일정을 수정할 수 없습니다.");
              return;
            }
            setIsEditMode(true);
          }}
          disabled={isPastDate(schedule.scheduledAt) || !canDelete}
          title={
            !canDelete
              ? "일정 생성자 또는 운영진만 수정할 수 있습니다."
              : isPastDate(schedule.scheduledAt)
                ? "과거 날짜에는 일정을 수정할 수 없습니다."
                : undefined
          }
        >
          수정하기
        </Button>
      </div>

      {/* 자식 모달들 */}
      {showDrawCreateModal && schedule && (
        <DrawCreateModal
          scheduleId={schedule.id}
          schedule={schedule}
          participants={participants}
          onClose={() => setShowDrawCreateModal(false)}
          onSuccess={async () => {
            setShowDrawCreateModal(false);
            await loadScheduleAndParticipants();
          }}
        />
      )}

      {showDrawViewModal && (
        <DrawViewModal
          schedule={schedule}
          participants={participants}
          onClose={() => setShowDrawViewModal(false)}
          onSuccess={async () => {
            setShowDrawViewModal(false);
            await loadScheduleAndParticipants();
          }}
        />
      )}

      {showParticipantManagementModal && schedule && (
        <ParticipantManagementModal
          scheduleId={schedule.id}
          schedule={schedule}
          currentParticipants={participants}
          clubMembers={clubMembers}
          onClose={() => setShowParticipantManagementModal(false)}
          onSuccess={async () => {
            setShowParticipantManagementModal(false);
            await loadScheduleAndParticipants();
          }}
        />
      )}
    </div>
  );
}
