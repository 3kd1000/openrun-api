import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMySchedules } from "../../../../../services/api/userApi";
import type { MyScheduleResponse, MatchType } from "../../../../../types/schedule";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "../../../../../components/common/Icons";
import { logError } from "../../../../../utils/errorHandler";
import { formatScheduleDateTime } from "../../../../../utils/dateUtils";

const getMatchTypeLabel = (matchType: MatchType | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
  }
};

const getMatchTypeBgColor = (mt?: string) => {
  switch (mt?.toLowerCase()) {
    case "men_doubles": return "bg-[#4a90e2]";
    case "women_doubles": return "bg-[#e91e63]";
    case "mixed_doubles": return "bg-[#9c27b0]";
    case "singles": return "bg-[#4caf50]";
    default: return "";
  }
};

interface MyUpcomingSchedulesWidgetProps {
  maxItems?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const MyUpcomingSchedulesWidget: React.FC<MyUpcomingSchedulesWidgetProps> = ({
  maxItems = 3,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [schedules, setSchedules] = useState<MyScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;

  useEffect(() => {
    loadMySchedules();
  }, []);

  const loadMySchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getMySchedules(true);
      // CONFIRMED 상태인 일정만 필터링
      const confirmed = data.filter(
        (item) => item.myParticipation?.status === "CONFIRMED"
      );
      // 날짜순 정렬 후 maxItems개만 표시
      const sorted = confirmed.sort(
        (a, b) =>
          new Date(a.schedule.scheduledAt).getTime() -
          new Date(b.schedule.scheduledAt).getTime()
      );
      setSchedules(sorted.slice(0, maxItems));
    } catch (error: unknown) {
      logError("내 일정 조회", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleClick = (scheduleId: number) => {
    navigate(`/schedules/${scheduleId}`, { state: { returnUrl: location.pathname } });
  };

  const handleViewAll = () => {
    navigate("/schedules/my");
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
          <UserIcon size={16} />
          <span className="text-sm font-semibold">
            다가오는 일정(개인)
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
              참여 확정된 일정이 없습니다
            </div>
          )}

          {!isLoading && schedules.length > 0 && (
            <div className="flex flex-col gap-2">
              {schedules.map((item) => {
                const { schedule, myParticipation } = item;
                const isGuest = myParticipation?.asGuest === true;

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
                    <span className="flex-1 flex items-center gap-0.5 text-muted-foreground min-w-0 text-xs">
                      {schedule.clubName && (
                        <span className="text-primary font-medium overflow-hidden text-ellipsis whitespace-nowrap shrink min-w-[40px]" title={schedule.clubName}>
                          [{schedule.clubName}]
                        </span>
                      )}
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap shrink" title={schedule.courtName}>
                        {schedule.courtName}
                      </span>
                      {getMatchTypeLabel(schedule.matchType) && (
                        <span className={`inline-flex items-center justify-center px-1.5 py-px rounded text-[10px] font-semibold ml-0.5 text-white shrink-0 ${getMatchTypeBgColor(schedule.matchType?.toLowerCase())}`}>
                          {getMatchTypeLabel(schedule.matchType)}
                        </span>
                      )}
                      {isGuest && (
                        <span className="inline-flex items-center justify-center px-1 py-px bg-green-100 text-green-700 rounded text-[10px] font-medium ml-0.5 shrink-0">
                          게스트
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground bg-white px-1.5 py-px rounded whitespace-nowrap shrink-0">
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

export default MyUpcomingSchedulesWidget;
