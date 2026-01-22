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
import { formatScheduleDateTime } from "../../../../utils/dateUtils";
import type { Schedule, MatchType } from "../../../../types/schedule";
import "./UpcomingSchedulesWidget.css";

const getMatchTypeLabel = (matchType: MatchType | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
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

  const truncateText = (text: string, maxLength: number = 8) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  const handleScheduleClick = (scheduleId: number) => {
    navigate(`/schedules/club`, { state: { openScheduleId: scheduleId } });
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
                      {formatScheduleDateTime(
                        schedule.scheduledAt,
                        schedule.durationMinutes
                      )}
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
                      {getMatchTypeLabel(schedule.matchType) && (
                        <span className={`upcoming-schedules-widget__match-type match-type--${schedule.matchType?.toLowerCase()}`}>
                          {getMatchTypeLabel(schedule.matchType)}
                        </span>
                      )}
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
