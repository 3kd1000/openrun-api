import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import BackButton from "../../../components/common/BackButton";
import { scheduleService } from "../../../services/scheduleService";
import type { CreateScheduleRequest } from "../../../types/schedule";
import { validateScheduleCreation } from "../../../utils/scheduleValidation";
import ScheduleFormSection, {
  type ScheduleFormData,
} from "../edit/ScheduleFormSection";
import { getOpenRunSession } from "../../../utils/openrunSession";

export default function ScheduleCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;

  // URL query params에서 초기값 추출
  const clubIdParam = searchParams.get("clubId");
  const dateParam = searchParams.get("date");

  const now = new Date();
  const defaultDate = dateParam || format(now, "yyyy-MM-dd");
  const defaultTime = "06:00";

  const currentClubId = clubIdParam
    ? parseInt(clubIdParam)
    : session.currentClubId
    ? parseInt(session.currentClubId)
    : 0;

  const initialData = {
    clubId: currentClubId,
    scheduledAt: `${defaultDate}T${defaultTime}:00`,
    courtName: "",
    maxCapacity: 4,
    cost: undefined,
    description: "",
    reservedByUserId: undefined,
    participationStartAt: null,
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (data: ScheduleFormData) => {
    // 과거 날짜 체크
    const validation = validateScheduleCreation(data.scheduledAt);
    if (!validation.isValid) {
      setError(validation.errorMessage || "일정 생성에 실패했습니다.");
      throw new Error(validation.errorMessage || "일정 생성에 실패했습니다.");
    }

    // 참가신청 시작시간 검증
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
        clubId: data.clubId,
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

      await scheduleService.createSchedule(
        requestData,
        currentUserId ?? undefined
      );
      // 성공 시 리스트로 복귀
      navigate(-1);
    } catch (err) {
      console.error("일정 생성 실패:", err);
      setError("일정 생성에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-4 flex items-center gap-2">
        <BackButton onClick={handleGoBack} />
        <span className="text-sm font-semibold">일정 등록</span>
      </div>

      <ScheduleFormSection
        mode="create"
        currentUserId={currentUserId}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleGoBack}
        loading={loading}
        error={error}
        submitButtonText="생성"
      />
    </div>
  );
}
