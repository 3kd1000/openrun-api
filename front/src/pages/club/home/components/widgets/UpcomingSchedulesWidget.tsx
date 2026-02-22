import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { scheduleService } from "../../../../../services/scheduleService";
import {
  CalendarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
} from "../../../../../components/common/Icons";
import { logError } from "../../../../../utils/errorHandler";
import { formatScheduleDateTime } from "../../../../../utils/dateUtils";
import { getOpenRunSession } from "../../../../../utils/openrunSession";
import type { Schedule, MatchType } from "../../../../../types/schedule";

const getMatchTypeLabel = (matchType: MatchType | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
  }
};

const getMatchTypeBgColor = (matchType: string | undefined) => {
  switch (matchType?.toLowerCase()) {
    case "men_doubles": return "bg-[#4a90e2]";
    case "women_doubles": return "bg-[#e91e63]";
    case "mixed_doubles": return "bg-[#9c27b0]";
    case "singles": return "bg-[#4caf50]";
    default: return "bg-gray-500";
  }
};

interface UpcomingSchedulesWidgetProps {
  clubId: number;
  maxItems?: number;
  defaultExpanded?: boolean;
  /**
   * controlled mode: 상위에서 expanded 상태를 관리할 때 사용
   */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const UpcomingSchedulesWidget: React.FC<UpcomingSchedulesWidgetProps> = ({
  clubId,
  maxItems = 2,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;

  useEffect(() => {
    loadUpcomingSchedules();
  }, [clubId]);

  const loadUpcomingSchedules = async () => {
    try {
      setIsLoading(true);
      const session = getOpenRunSession();
      const userId = session.userId;
      if (!userId) {
        console.error("userId가 없습니다.");
        return;
      }
      const data = await scheduleService.getUpcomingSchedules(userId, clubId);
      const now = new Date();
      const upcoming = data.filter((s) => new Date(s.scheduledAt) >= now);
      const pinned = upcoming
        .filter((s) => s.pinned === true)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        );
      const unpinned = upcoming
        .filter((s) => s.pinned !== true)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        );
      setSchedules([...pinned, ...unpinned].slice(0, maxItems));
    } catch (error: unknown) {
      logError("다가오는 일정 조회", error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 8) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  const handleScheduleClick = (scheduleId: number) => {
    navigate(`/schedules/${scheduleId}`, { state: { returnUrl: location.pathname } });
  };

  const handleViewAll = () => {
    navigate("/schedules/club");
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(next);
      return;
    }
    setInternalExpanded(next);
  };

  return (
    <div className="border border-border rounded-xl bg-white px-3 py-2">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 cursor-pointer text-foreground hover:text-primary transition-colors"
          onClick={handleToggleExpand}
        >
          <CalendarIcon size={16} />
          <span className="text-sm font-semibold">
            다가오는 일정(클럽)
          </span>
          {isExpanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
        </button>
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 px-3 text-muted-foreground text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3">
          {isLoading && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          )}

          {!isLoading && schedules.length === 0 && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              예정된 일정이 없습니다
            </div>
          )}

          {!isLoading && schedules.length > 0 && (
            <div className="flex flex-col gap-2">
              {schedules.map((schedule) => {
                const isFull =
                  schedule.currentParticipants >= schedule.maxCapacity;

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-1.5 py-2 px-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors text-xs min-h-[40px]"
                    onClick={() => handleScheduleClick(schedule.id)}
                  >
                    <span className="text-foreground font-medium whitespace-nowrap min-w-[90px] text-xs">
                      {formatScheduleDateTime(
                        schedule.scheduledAt,
                        schedule.durationMinutes
                      )}
                    </span>
                    <span className="flex-1 flex items-center gap-0.5 text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis text-xs min-w-0">
                      {schedule.pinned ? (
                        <span
                          className="inline-flex items-center justify-center mr-0.5 text-amber-500 align-middle shrink-0"
                          title="강조"
                        >
                          <StarIcon size={12} />
                        </span>
                      ) : null}
                      <span className="overflow-hidden text-ellipsis shrink min-w-[40px]" title={schedule.courtName}>
                        {schedule.courtName}
                      </span>
                      {getMatchTypeLabel(schedule.matchType) && (
                        <span className={`inline-flex items-center justify-center px-1.5 py-px text-[10px] font-semibold rounded text-white whitespace-nowrap shrink-0 ${getMatchTypeBgColor(schedule.matchType?.toLowerCase())}`}>
                          {getMatchTypeLabel(schedule.matchType)}
                        </span>
                      )}
                      {schedule.reservedByUserName && (
                        <span className="shrink-0 text-muted-foreground">
                         예약자:{truncateText(schedule.reservedByUserName, 3)}
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-xs text-muted-foreground bg-white px-1.5 py-px rounded whitespace-nowrap shrink-0${
                        isFull
                          ? " text-red-500 bg-red-50"
                          : ""
                      }`}
                    >
                      {schedule.currentParticipants}/{schedule.maxCapacity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedulesWidget;
