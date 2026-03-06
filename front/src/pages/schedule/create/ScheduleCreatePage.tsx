import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { AppHeader } from "../../../components/common/AppHeader";
import { scheduleService } from "../../../services/scheduleService";
import type { CreateScheduleRequest } from "../../../types/schedule";
import { validateScheduleCreation } from "../../../utils/scheduleValidation";
import ScheduleFormSection, {
  type ScheduleFormData,
} from "../edit/ScheduleFormSection";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import { cn } from "../../../lib/utils";
import { getOpenRunUiSettings, setOpenRunUiSettings } from "../../../utils/openrunUiSettings";
import ScheduleTypeWizard from "./ScheduleTypeWizard";

export default function ScheduleCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;

  // URL query params에서 초기값 추출
  const clubIdParam = searchParams.get("clubId");
  const dateParam = searchParams.get("date");

  // 클럽 보유 여부에 따라 기본값 결정
  const isPublicRoute = location.pathname.includes("/public/");
  const hasClub = !!(clubIdParam !== "null" && clubIdParam) || !!session.currentClubId;
  const [isPublic, setIsPublic] = useState(isPublicRoute || !hasClub);
  const [showWizard, setShowWizard] = useState(() => {
    if (isPublicRoute) return false;
    return !getOpenRunUiSettings().scheduleWizardSeen;
  });

  const currentClubId = clubIdParam && clubIdParam !== "null"
    ? parseInt(clubIdParam)
    : session.currentClubId
    ? parseInt(session.currentClubId)
    : 0;

  const clubInitialData = {
    clubId: currentClubId,
    ...(dateParam ? { scheduledAt: `${dateParam}T06:00:00` } : {}),
    courtName: "",
    maxCapacity: 4,
    cost: undefined,
    description: "",
    reservedByUserId: undefined,
    participationStartAt: null,
  };

  const publicInitialData = {
    ...(dateParam ? { scheduledAt: `${dateParam}T06:00:00` } : {}),
    courtName: "",
    maxCapacity: 4,
    cost: undefined,
    description: "",
    courtAddress: "",
    region: "",
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (data: ScheduleFormData) => {
    if (isPublic) {
      // --- 공개일정 생성 ---
      if (!data.courtName.trim()) {
        setError("코트명을 입력해주세요.");
        throw new Error("코트명을 입력해주세요.");
      }

      if (!currentUserId) {
        setError("로그인이 필요합니다.");
        throw new Error("로그인이 필요합니다.");
      }

      setLoading(true);
      setError("");

      try {
        const created = await scheduleService.createPublicSchedule({
          courtName: data.courtName.trim(),
          courtAddress: data.courtAddress?.trim() || undefined,
          region: data.region?.trim() || undefined,
          scheduledAt: data.scheduledAt,
          maxCapacity: data.maxCapacity,
          cost: data.cost,
          description: data.description?.trim() || undefined,
          matchType: data.matchType === "NONE" ? undefined : data.matchType,
          durationMinutes: data.durationMinutes,
          numberOfCourts: data.numberOfCourts,
        });
        showToast("공개일정이 생성되었습니다", "success");
        navigate(`/schedules/${created.id}`);
      } catch (err: unknown) {
        console.error("공개일정 생성 실패:", err);
        const errorMessage = (
          err as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setError(errorMessage || "공개일정 생성에 실패했습니다.");
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // --- 클럽일정 생성 ---
      const validation = validateScheduleCreation(data.scheduledAt);
      if (!validation.isValid) {
        setError(validation.errorMessage || "일정 생성에 실패했습니다.");
        throw new Error(
          validation.errorMessage || "일정 생성에 실패했습니다."
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
          courtAddress: data.courtAddress?.trim() || undefined,
          region: data.region?.trim() || undefined,
        };

        await scheduleService.createSchedule(requestData);
        navigate(-1);
      } catch (err) {
        console.error("일정 생성 실패:", err);
        setError("일정 생성에 실패했습니다.");
        throw err;
      } finally {
        setLoading(false);
      }
    }
  };

  if (showWizard) {
    return (
      <ScheduleTypeWizard
        hasClub={hasClub}
        onSelect={(selectedIsPublic, dontShowAgain) => {
          setIsPublic(selectedIsPublic);
          if (dontShowAgain) {
            setOpenRunUiSettings({ scheduleWizardSeen: true });
          }
          setShowWizard(false);
        }}
        onBack={handleGoBack}
      />
    );
  }

  return (
    <div className="page-container">
      <AppHeader title="일정 등록" onBack={handleGoBack} />

      {/* 공개/클럽 세그먼트 버튼 + 가이드 다시보기 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              !isPublic
                ? "bg-primary text-white"
                : "bg-background text-muted-foreground",
              !hasClub && "opacity-40 cursor-not-allowed"
            )}
            onClick={() => hasClub && setIsPublic(false)}
            disabled={!hasClub}
          >
            클럽일정
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              isPublic
                ? "bg-primary text-white"
                : "bg-background text-muted-foreground"
            )}
            onClick={() => setIsPublic(true)}
          >
            공개일정
          </button>
        </div>
        <button
          type="button"
          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          onClick={() => setShowWizard(true)}
          title="일정 유형 가이드 보기"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <ScheduleFormSection
        key={isPublic ? "public" : "club"}
        mode="create"
        currentUserId={currentUserId}
        isPublicSchedule={isPublic}
        initialData={isPublic ? publicInitialData : clubInitialData}
        onSubmit={handleSubmit}
        onCancel={handleGoBack}
        loading={loading}
        error={error}
        submitButtonText={isPublic ? "일정 만들기" : "생성"}
      />
    </div>
  );
}
