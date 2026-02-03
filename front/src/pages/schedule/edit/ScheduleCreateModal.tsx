import React, { useState } from "react";
import { format } from "date-fns";
import { scheduleService } from "../../../services/scheduleService";
import type { CreateScheduleRequest } from "../../../types/schedule";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { validateScheduleCreation } from "../../../utils/scheduleValidation";
import ScheduleFormSection, {
  type ScheduleFormData,
} from "./ScheduleFormSection";
import "./ScheduleCreateModal.css";
import { getOpenRunSession } from "../../../utils/openrunSession";

interface Props {
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleCreateModal: React.FC<Props> = ({
  initialDate,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;

  // ESC 키로 모달 닫기
  useEscapeKey(onClose);

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
        throw new Error("참가신청 시작시간은 일정 시간보다 이전이어야 합니다.");
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

      await scheduleService.createSchedule(requestData, currentUserId ?? undefined);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("일정 생성 실패:", err);
      setError("일정 생성에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 초기 날짜 생성 (initialDate prop 활용)
  const now = new Date();
  const defaultDate = initialDate
    ? initialDate.split("T")[0]
    : format(now, "yyyy-MM-dd");
  const defaultTime = initialDate
    ? initialDate.split("T")[1]?.substring(0, 5) || "06:00"
    : "06:00";

  // 현재 선택된 클럽 ID 가져오기
  const currentClubId = session.currentClubId
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>일정 생성</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <ScheduleFormSection
          mode="create"
          currentUserId={currentUserId}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          error={error}
          submitButtonText="생성"
        />
      </div>
    </div>
  );
};

export default ScheduleCreateModal;
