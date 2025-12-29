import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { format, isSameDay } from "date-fns";
import type { Schedule } from "../../../types/schedule";
import { holidayService, type Holiday } from "../../../services/holidayService";
import "react-calendar/dist/Calendar.css";
import "./ScheduleCalendarView.css";

interface Props {
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  onDateDoubleClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  myParticipations: Set<number>;
  calendarDate?: Date;
  onCalendarDateChange?: (date: Date) => void;
}

const ScheduleCalendarView: React.FC<Props> = ({
  schedules,
  onDateClick,
  onDateDoubleClick,
  onScheduleClick,
  myParticipations,
  calendarDate,
  onCalendarDateChange,
}) => {
  // 외부에서 전달된 calendarDate가 있으면 사용, 없으면 오늘 날짜
  const [date, setDate] = useState<Date>(calendarDate || new Date());
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const calendarRef = React.useRef<HTMLDivElement>(null);
  const isHorizontalSwipe = React.useRef(false);

  // 외부에서 전달된 calendarDate가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    if (calendarDate) {
      setDate(calendarDate);
    }
  }, [calendarDate]);

  // 현재 표시 중인 년도의 공휴일 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = date.getFullYear();
        const yearHolidays = await holidayService.getHolidays(year);
        setHolidays(yearHolidays);
      } catch (error) {
        console.error("공휴일 정보 로드 실패:", error);
        setHolidays([]);
      }
    };

    loadHolidays();
  }, [date]);

  // 특정 날짜의 일정들 가져오기
  const getSchedulesForDate = (date: Date): Schedule[] => {
    return schedules.filter((schedule) =>
      isSameDay(new Date(schedule.scheduledAt), date)
    );
  };

  // 타일 콘텐츠 렌더링
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const daySchedules = getSchedulesForDate(date);

      if (daySchedules.length === 0) return null;

      return (
        <div className="calendar-tile-content">
          {daySchedules.slice(0, 3).map((schedule) => {
            const isPast = new Date(schedule.scheduledAt) < new Date();
            const isParticipating = myParticipations.has(schedule.id);
            const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
            const hasValidDraw = schedule.drawType && schedule.isDrawValid;
            return (
              <div
                key={schedule.id}
                className={`calendar-event ${isPast ? "past-event" : ""} ${
                  !isParticipating ? "not-participating" : ""
                } ${hasInvalidDraw ? "invalid-draw" : ""} ${
                  hasValidDraw ? "has-valid-draw" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleClick(schedule);
                }}
                title={`${schedule.courtName} - ${format(
                  new Date(schedule.scheduledAt),
                  "HH:mm"
                )}${
                  hasInvalidDraw
                    ? " ⚠️ 대진표 무효"
                    : hasValidDraw
                    ? " ✓ 대진표 생성 완료"
                    : ""
                }`}
              >
                <span className="event-time">
                  {format(new Date(schedule.scheduledAt), "HH:mm")}
                </span>
                <span className="event-name">
                  {schedule.courtName}
                  {hasInvalidDraw && (
                    <span className="invalid-indicator">⚠️</span>
                  )}
                  {hasValidDraw && <span className="valid-indicator">✓</span>}
                </span>
              </div>
            );
          })}
          {daySchedules.length > 3 && (
            <div className="calendar-event-more">
              +{daySchedules.length - 3} more
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 타일 클릭 핸들러 (단일 클릭 vs 더블클릭 구분)
  const handleTileClick = (date: Date) => {
    if (clickTimeout) {
      // 더블클릭
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      onDateDoubleClick(date);
    } else {
      // 단일 클릭 (300ms 후 실행)
      const timeout = setTimeout(() => {
        onDateClick(date);
        setClickTimeout(null);
      }, 300);
      setClickTimeout(timeout);
    }
  };

  // 날짜가 일요일인지 확인
  const isSunday = (date: Date): boolean => {
    return date.getDay() === 0;
  };

  // 날짜가 공휴일인지 확인
  const isHoliday = (date: Date): boolean => {
    if (holidays.length === 0) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    return holidayService.isHolidayFromString(dateStr, holidays);
  };

  // 타일 클래스명 결정 (일요일 또는 공휴일이면 holiday 클래스 추가)
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const classes: string[] = [];

    if (isSunday(date)) {
      classes.push("holiday-sunday");
    }

    if (isHoliday(date)) {
      classes.push("holiday");
    }

    return classes.length > 0 ? classes.join(" ") : null;
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (!value) return;
    const newDate = Array.isArray(value) ? value[0] : value;
    if (!(newDate instanceof Date)) return;

    // 애니메이션 효과를 위한 처리
    if (isAnimating) return;

    setIsAnimating(true);
    setDate(newDate);

    // 외부 상태도 업데이트
    if (onCalendarDateChange) {
      onCalendarDateChange(newDate);
    }

    // 애니메이션 완료 후 상태 초기화
    setTimeout(() => {
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300);
  };

  // 제스처로 월 넘기기 (스와이프)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // 수평 스와이프가 수직 스와이프보다 크면 스크롤 방지
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
      e.preventDefault(); // 스크롤 방지
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // 수평 스와이프가 수직 스와이프보다 크고, 최소 50px 이상 이동했을 때만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const newDate = new Date(date);
      if (deltaX > 0) {
        // 오른쪽으로 스와이프 = 이전 달
        setSlideDirection("right");
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        // 왼쪽으로 스와이프 = 다음 달
        setSlideDirection("left");
        newDate.setMonth(newDate.getMonth() + 1);
      }
      handleDateChange(newDate);
    }

    setTouchStart(null);
    isHorizontalSwipe.current = false;
  };

  // 마우스 드래그로도 월 넘기기 (데스크탑)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart({ x: e.clientX, y: e.clientY });
    isHorizontalSwipe.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart) return;

    const deltaX = e.clientX - touchStart.x;
    const deltaY = e.clientY - touchStart.y;

    // 수평 드래그가 수직 드래그보다 크면 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!touchStart) return;

    const deltaX = e.clientX - touchStart.x;
    const deltaY = e.clientY - touchStart.y;

    // 수평 드래그가 수직 드래그보다 크고, 최소 50px 이상 이동했을 때만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const newDate = new Date(date);
      if (deltaX > 0) {
        // 오른쪽으로 드래그 = 이전 달
        setSlideDirection("right");
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        // 왼쪽으로 드래그 = 다음 달
        setSlideDirection("left");
        newDate.setMonth(newDate.getMonth() + 1);
      }
      handleDateChange(newDate);
    }

    setTouchStart(null);
    isHorizontalSwipe.current = false;
  };

  return (
    <div
      className="calendar-view"
      ref={calendarRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setTouchStart(null);
        isHorizontalSwipe.current = false;
      }}
    >
      <div
        className={`calendar-wrapper ${
          isAnimating
            ? slideDirection === "left"
              ? "slide-left"
              : slideDirection === "right"
              ? "slide-right"
              : ""
            : ""
        }`}
      >
        <Calendar
          value={date}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={handleDateChange as (value: any) => void}
          tileContent={tileContent}
          tileClassName={tileClassName}
          locale="ko-KR"
          calendarType="gregory"
          formatDay={(_locale, date) => format(date, "d")}
          onClickDay={handleTileClick}
          showNeighboringMonth={false}
        />
      </div>
    </div>
  );
};

export default ScheduleCalendarView;
