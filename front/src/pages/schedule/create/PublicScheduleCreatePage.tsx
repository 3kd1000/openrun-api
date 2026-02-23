import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../components/common/BackButton";
import { scheduleService } from "../../../services/scheduleService";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import ScheduleFormSection, {
  type ScheduleFormData,
} from "../edit/ScheduleFormSection";

export default function PublicScheduleCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;

  const initialData = {
    courtName: "",
    cost: undefined,
    description: "",
    courtAddress: "",
    region: "",
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (data: ScheduleFormData) => {
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
      const created = await scheduleService.createPublicSchedule(
        {
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
        },
        currentUserId
      );
      showToast("공개일정이 생성되었습니다", "success");
      navigate(`/schedules/${created.id}`);
    } catch (err: unknown) {
      console.error("공개일정 생성 실패:", err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || "공개일정 생성에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="mb-4 flex items-center gap-2">
        <BackButton onClick={handleGoBack} />
        <span className="text-sm font-semibold">공개일정 만들기</span>
      </div>

      <ScheduleFormSection
        mode="create"
        currentUserId={currentUserId}
        isPublicSchedule={true}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleGoBack}
        loading={loading}
        error={error}
        submitButtonText="일정 만들기"
      />
    </div>
  );
}
