import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySchedules } from "../../../../services/api/userApi";
import type { MyScheduleResponse } from "../../../../types/schedule";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "../../../../components/common/Icons";
import { logError } from "../../../../utils/errorHandler";
import "./MyUpcomingSchedulesWidget.css";

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

  const formatDateTimeInline = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}/${day}(${weekday}) ${hours}:${minutes}`;
  };

  const truncateText = (text: string, maxLength: number = 8) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  const handleScheduleClick = (scheduleId: number) => {
    navigate(`/schedules`, { state: { openScheduleId: scheduleId } });
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
    <div className="my-upcoming-schedules-widget">
      <div className="my-upcoming-schedules-widget__header">
        <button
          className="my-upcoming-schedules-widget__header-left"
          onClick={handleToggleExpand}
        >
          <UserIcon size={16} />
          <span className="my-upcoming-schedules-widget__title">
            다가오는 일정(개인)
          </span>
          {isExpanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
        </button>
        <button
          className="my-upcoming-schedules-widget__view-all"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="my-upcoming-schedules-widget__content">
          {isLoading && (
            <div className="my-upcoming-schedules-widget__loading">
              불러오는 중...
            </div>
          )}

          {!isLoading && schedules.length === 0 && (
            <div className="my-upcoming-schedules-widget__empty">
              참여 확정된 일정이 없습니다
            </div>
          )}

          {!isLoading && schedules.length > 0 && (
            <div className="my-upcoming-schedules-widget__list">
              {schedules.map((item) => {
                const { schedule, myParticipation } = item;
                const isGuest = myParticipation?.asGuest === true;

                return (
                  <div
                    key={schedule.id}
                    className="my-upcoming-schedules-widget__item"
                    onClick={() => handleScheduleClick(schedule.id)}
                  >
                    <span className="my-upcoming-schedules-widget__datetime">
                      {formatDateTimeInline(schedule.scheduledAt)}
                    </span>
                    <span className="my-upcoming-schedules-widget__info">
                      {schedule.clubName && (
                        <span className="my-upcoming-schedules-widget__club-name">
                          [{truncateText(schedule.clubName, 6)}]
                        </span>
                      )}
                      {truncateText(schedule.courtName)}
                      {isGuest && (
                        <span className="my-upcoming-schedules-widget__guest-badge">
                          게스트
                        </span>
                      )}
                    </span>
                    <span className="my-upcoming-schedules-widget__capacity">
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
