import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { scheduleService } from "../../../services/scheduleService";
import { participantService } from "../../../services/participantService";
import type { Schedule } from "../../../types/schedule";
import { isPastDate } from "../../../utils/scheduleValidation";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import { getOpenRunSession } from "../../../utils/openrunSession";
import { useToast } from "../../../contexts/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

const getMatchTypeLabel = (matchType: string | null | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
  }
};

const getMatchTypeBadgeClass = (matchType: string | null | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "bg-blue-100 text-blue-700";
    case "WOMEN_DOUBLES": return "bg-pink-100 text-pink-700";
    case "MIXED_DOUBLES": return "bg-purple-100 text-purple-700";
    case "SINGLES": return "bg-emerald-100 text-emerald-700";
    default: return "";
  }
};

const getCapacityBadgeClass = (isSelected: boolean, isFull: boolean): string => {
  if (isSelected) return "bg-blue-100 text-blue-700";
  if (isFull) return "bg-red-100 text-red-700";
  return "bg-emerald-100 text-emerald-700";
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
  const [localParticipantCounts, setLocalParticipantCounts] = useState<Map<number, number>>(new Map());

  const session = getOpenRunSession();
  const currentUserId = session.userId ?? null;
  const currentClubId = session.currentClubId ? parseInt(session.currentClubId) : 1;

  useEffect(() => {
    const loadSchedules = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        setError("");

        const clubSchedules = await scheduleService.getAllSchedules(currentClubId);

        const futureSchedules = clubSchedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.scheduledAt);
          const now = new Date();
          return scheduleDate >= now || !isPastDate(schedule.scheduledAt);
        });

        futureSchedules.sort((a, b) => {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        });

        setSchedules(futureSchedules);

        const initialCounts = new Map<number, number>();
        futureSchedules.forEach((schedule) => {
          initialCounts.set(schedule.id, schedule.currentParticipants);
        });
        setLocalParticipantCounts(initialCounts);

        const myParticipationIds = await scheduleService.getMyParticipations();
        const initialSelected = new Set<number>(myParticipationIds);

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

  const handleToggle = (scheduleId: number) => {
    setSelectedScheduleIds((prev) => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(scheduleId);

      if (wasSelected) {
        newSet.delete(scheduleId);
        setLocalParticipantCounts((prevCounts) => {
          const newCounts = new Map(prevCounts);
          const currentCount = newCounts.get(scheduleId) || 0;
          newCounts.set(scheduleId, Math.max(0, currentCount - 1));
          return newCounts;
        });
      } else {
        newSet.add(scheduleId);
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

  const handleSave = async () => {
    if (!currentUserId) {
      showToast("로그인이 필요합니다", "warning");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await participantService.batchParticipation({
        selectedScheduleIds: Array.from(selectedScheduleIds),
      });

      if (response.failedOperations.length > 0) {
        const failedMessages = response.failedOperations
          .map((op) => `일정 ID ${op.scheduleId}: ${op.errorMessage}`)
          .join("\n");
        showToast(`일부 작업이 실패했습니다: ${failedMessages}`, "error");
      }

      onSuccess();
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

  const canParticipate = (schedule: Schedule): boolean => {
    if (schedule.participationStartAt) {
      const startTime = new Date(schedule.participationStartAt);
      const now = new Date();
      return now >= startTime;
    }
    return true;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-[700px] w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>빠른 신청</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden flex-1 px-6 py-4 max-[768px]:px-3 max-[768px]:py-3 max-[768px]:gap-3">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
          )}

          {loading ? (
            <div className="py-8 px-4 text-center text-muted-foreground text-sm">
              일정 목록을 불러오는 중...
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-8 px-4 text-center text-muted-foreground text-sm">
              참가 가능한 일정이 없습니다.
            </div>
          ) : (
            <div className="max-h-[60vh] min-h-[200px] overflow-y-auto flex flex-col gap-2 p-0.5 md:max-h-[65vh]">
              {schedules.map((schedule) => {
                const isAvailable = canParticipate(schedule);
                const isSelected = selectedScheduleIds.has(schedule.id);
                const currentCount = localParticipantCounts.get(schedule.id) ?? schedule.currentParticipants;
                const isFull = currentCount >= schedule.maxCapacity;

                return (
                  <div
                    key={schedule.id}
                    className={cn(
                      "border rounded-lg transition-all",
                      isAvailable && "hover:border-primary hover:shadow-sm",
                      !isAvailable && "opacity-[0.65] cursor-not-allowed bg-muted border-muted"
                    )}
                  >
                    <label
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer w-full max-[768px]:gap-2 max-[768px]:p-2",
                        !isAvailable && "cursor-not-allowed"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(schedule.id)}
                        disabled={!isAvailable}
                      />
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex justify-between items-center gap-2 w-full">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="text-sm md:text-[15px] text-muted-foreground font-medium shrink-0">
                              코트명 -
                            </span>
                            <span className="text-sm md:text-[15px] font-medium text-foreground truncate">
                              {schedule.courtName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {getMatchTypeLabel(schedule.matchType) && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  getMatchTypeBadgeClass(schedule.matchType)
                                )}
                              >
                                {getMatchTypeLabel(schedule.matchType)}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                getCapacityBadgeClass(isSelected, isFull)
                              )}
                            >
                              {currentCount}/{schedule.maxCapacity}명
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 w-full">
                          <div className="flex items-center gap-1">
                            <span className="text-sm md:text-[15px] text-muted-foreground font-medium shrink-0">
                              모임일정 -
                            </span>
                            <span className="text-sm md:text-[15px] text-muted-foreground">
                              {formatScheduleDateTime(
                                schedule.scheduledAt,
                                schedule.durationMinutes
                              )}
                            </span>
                          </div>
                          {schedule.participationStartAt && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm md:text-[15px] text-muted-foreground font-medium shrink-0">
                                신청시작 -
                              </span>
                              <span
                                className={cn(
                                  "text-sm md:text-[15px] font-semibold",
                                  isAvailable
                                    ? "text-green-600"
                                    : "text-[#f57c00] font-bold"
                                )}
                              >
                                {isAvailable
                                  ? "신청가능"
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
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0" showCloseButton={false}>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={loading || saving}
              className="flex-1"
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleJoinModal;
