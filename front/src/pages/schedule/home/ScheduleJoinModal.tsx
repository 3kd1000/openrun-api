import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import type { Schedule } from "../../../types/schedule";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { isPastDate } from "../../../utils/scheduleValidation";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import "./ScheduleJoinModal.css";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";

const getMatchTypeLabel = (matchType: string | null | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
  }
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleJoinModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // 체크박스 상태 변경에 따른 인원수 추적
  const [localParticipantCounts, setLocalParticipantCounts] = useState<Map<number, number>>(new Map());

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;
  const currentClubId = session.currentClubId ? parseInt(session.currentClubId) : 1;

  // ESC 키로 모달 닫기
  useEscapeKey(onClose, !saving);

  // 일정 목록 로드
  useEffect(() => {
    const loadSchedules = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        setError("");

        // 현재 클럽의 모든 일정 조회
        const clubSchedules = await scheduleService.getAllSchedules(currentUserId, currentClubId);

        // 과거 제외, 오늘 포함 (시간 안 지난 경우)
        const futureSchedules = clubSchedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.scheduledAt);
          const now = new Date();

          // 오늘 또는 미래 날짜만
          return scheduleDate >= now || !isPastDate(schedule.scheduledAt);
        });

        // 날짜순 정렬 (가까운 일정 위)
        futureSchedules.sort((a, b) => {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        });

        setSchedules(futureSchedules);

        // 초기 인원수 맵 설정
        const initialCounts = new Map<number, number>();
        futureSchedules.forEach((schedule) => {
          initialCounts.set(schedule.id, schedule.currentParticipants);
        });
        setLocalParticipantCounts(initialCounts);

        // 내가 참가신청한 일정 ID 조회
        const myParticipationIds = await scheduleService.getMyParticipations(currentUserId);
        const initialSelected = new Set<number>(myParticipationIds);

        // 현재/미래 일정 중에서만 필터링
        const futureParticipations = new Set<number>();
        futureSchedules.forEach((schedule) => {
          if (initialSelected.has(schedule.id)) {
            futureParticipations.add(schedule.id);
          }
        });

        setSelectedScheduleIds(futureParticipations);
      } catch (err) {
        console.error("일정 목록 로드 실패:", err);
        setError("일정 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [currentClubId, currentUserId]);

  // 체크박스 토글
  const handleToggle = (scheduleId: number) => {
    setSelectedScheduleIds((prev) => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(scheduleId);
      
      if (wasSelected) {
        newSet.delete(scheduleId);
        // 체크 해제: 인원수 감소
        setLocalParticipantCounts((prevCounts) => {
          const newCounts = new Map(prevCounts);
          const currentCount = newCounts.get(scheduleId) || 0;
          newCounts.set(scheduleId, Math.max(0, currentCount - 1));
          return newCounts;
        });
      } else {
        newSet.add(scheduleId);
        // 체크: 인원수 증가
        setLocalParticipantCounts((prevCounts) => {
          const newCounts = new Map(prevCounts);
          const currentCount = newCounts.get(scheduleId) || 0;
          newCounts.set(scheduleId, currentCount + 1);
          return newCounts;
        });
      }
      
      return newSet;
    });
  };

  // 저장
  const handleSave = async () => {
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await participantService.batchParticipation(currentUserId, {
        selectedScheduleIds: Array.from(selectedScheduleIds),
      });

      // 실패한 작업이 있으면 경고
      if (response.failedOperations.length > 0) {
        const failedMessages = response.failedOperations
          .map((op) => `일정 ID ${op.scheduleId}: ${op.errorMessage}`)
          .join("\n");
        showToast(`일부 작업이 실패했습니다: ${failedMessages}`, "error");
      }

      onSuccess(); // 부모 컴포넌트 새로고침
      onClose();
    } catch (err: unknown) {
      console.error("배치 참가신청 실패:", err);
      const errorMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(errorMessage || "참가신청 처리에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 참가신청 가능 여부 확인
  const canParticipate = (schedule: Schedule): boolean => {
    // 참가신청 시작시간이 설정되어 있으면 확인
    if (schedule.participationStartAt) {
      const startTime = new Date(schedule.participationStartAt);
      const now = new Date();
      return now >= startTime;
    }
    return true; // 시작시간 미설정이면 항상 가능
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content schedule-join-modal modal-nested-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>빠른 신청</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="sjm-content">
          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="sjm-loading">일정 목록을 불러오는 중...</div>
          ) : schedules.length === 0 ? (
            <div className="sjm-empty">참가 가능한 일정이 없습니다.</div>
          ) : (
            <div className="sjm-schedule-list">
              {schedules.map((schedule) => {
                const isAvailable = canParticipate(schedule);
                const isSelected = selectedScheduleIds.has(schedule.id);
                // 로컬 인원수 사용 (체크박스 상태 변경 반영)
                const currentCount = localParticipantCounts.get(schedule.id) ?? schedule.currentParticipants;
                const isFull = currentCount >= schedule.maxCapacity;

                return (
                  <div
                    key={schedule.id}
                    className={`sjm-schedule-item ${!isAvailable ? "sjm-schedule-item--disabled" : ""}`}
                  >
                    <label className="sjm-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(schedule.id)}
                        disabled={!isAvailable}
                        className="sjm-checkbox"
                      />
                      <div className="sjm-schedule-info">
                        <div className="sjm-schedule-header">
                          <div className="sjm-court-name-row">
                            <span className="sjm-label">코트명 -</span>
                            <span className="sjm-court-name">{schedule.courtName}</span>
                            {getMatchTypeLabel(schedule.matchType) && (
                              <span className={`sjm-match-type-badge sjm-match-type--${schedule.matchType?.toLowerCase()}`}>
                                {getMatchTypeLabel(schedule.matchType)}
                              </span>
                            )}
                          </div>
                          <span
                            className={`sjm-capacity ${
                              isFull ? "sjm-capacity--full" : ""
                            } ${isSelected ? "sjm-capacity--joined" : ""}`}
                          >
                            {currentCount}/{schedule.maxCapacity}명
                            {isSelected && " (신청완료)"}
                          </span>
                        </div>
                        <div className="sjm-schedule-meta">
                          <div className="sjm-date-row">
                            <span className="sjm-label">모임일정 -</span>
                            <span className="sjm-date">
                              {formatScheduleDateTime(
                                schedule.scheduledAt,
                                schedule.durationMinutes
                              )}
                            </span>
                          </div>
                          {schedule.participationStartAt && (
                            <div className="sjm-participation-start-row">
                              <span className="sjm-label">신청시작 -</span>
                              <span
                                className={`sjm-participation-start ${
                                  !isAvailable ? "sjm-participation-start--pending" : ""
                                }`}
                              >
                                {isAvailable
                                  ? `신청가능`
                                  : format(
                                      new Date(schedule.participationStartAt),
                                      "M월 d일 (E) HH:mm",
                                      { locale: ko }
                                    )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              disabled={loading || saving}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleJoinModal;
