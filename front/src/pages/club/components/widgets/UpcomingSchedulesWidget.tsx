import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scheduleService } from "../../../../services/scheduleService";
import {
  CalendarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
} from "../../../../components/common/Icons";
import { logError } from "../../../../utils/errorHandler";
import type { Schedule } from "../../../../types/schedule";
import "./UpcomingSchedulesWidget.css";

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
      const data = await scheduleService.getUpcomingSchedules(clubId);
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
    <div className="upcoming-schedules-widget">
      <div className="upcoming-schedules-widget__header">
        <button
          className="upcoming-schedules-widget__header-left"
          onClick={handleToggleExpand}
        >
          <CalendarIcon size={16} />
          <span className="upcoming-schedules-widget__title">
            다가오는 일정(클럽)
          </span>
          {isExpanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
        </button>
        <button
          className="upcoming-schedules-widget__view-all"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="upcoming-schedules-widget__content">
          {isLoading && (
            <div className="upcoming-schedules-widget__loading">
              불러오는 중...
            </div>
          )}

          {!isLoading && schedules.length === 0 && (
            <div className="upcoming-schedules-widget__empty">
              예정된 일정이 없습니다
            </div>
          )}

          {!isLoading && schedules.length > 0 && (
            <div className="upcoming-schedules-widget__list">
              {schedules.map((schedule) => {
                const isFull =
                  schedule.currentParticipants >= schedule.maxCapacity;

                return (
                  <div
                    key={schedule.id}
                    className="upcoming-schedules-widget__item"
                    onClick={() => handleScheduleClick(schedule.id)}
                  >
                    <span className="upcoming-schedules-widget__datetime">
                      {formatDateTimeInline(schedule.scheduledAt)}
                    </span>
                    <span className="upcoming-schedules-widget__info">
                      {schedule.pinned ? (
                        <span
                          className="upcoming-schedules-widget__pinned"
                          title="강조"
                        >
                          <StarIcon size={14} />
                        </span>
                      ) : null}
                      코트명:{truncateText(schedule.courtName)}
                      {schedule.reservedByUserName
                        ? `, 예약자:${truncateText(
                            schedule.reservedByUserName,
                            6
                          )}`
                        : ""}
                    </span>
                    <span
                      className={`upcoming-schedules-widget__capacity ${
                        isFull
                          ? "upcoming-schedules-widget__capacity--full"
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
