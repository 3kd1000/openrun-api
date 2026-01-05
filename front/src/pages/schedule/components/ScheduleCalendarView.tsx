import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { format, isSameDay, lastDayOfMonth, getDate } from "date-fns";
import type { Schedule } from "../../../types/schedule";
import { holidayService, type Holiday } from "../../../services/holidayService";
import "react-calendar/dist/Calendar.css";
import "./ScheduleCalendarView.css";

// 화면 너비 추적 훅
const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenWidth;
};

// 화면 너비에 따른 최대 코트명 글자 수 계산
const getMaxCourtNameLength = (screenWidth: number): number => {
  if (screenWidth <= 360) return 2; // 아주 좁은 화면 (Galaxy Fold 등)
  if (screenWidth <= 400) return 3; // 좁은 화면 (iPhone SE)
  if (screenWidth <= 768) return 4; // 일반 모바일
  return 999; // 데스크톱 (전체 표시)
};

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
  const screenWidth = useScreenWidth();
  const maxCourtNameLength = getMaxCourtNameLength(screenWidth);

  // Long press 감지를 위한 state
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const longPressTarget = React.useRef<Date | null>(null);
  const [pressStart, setPressStart] = useState<{ x: number; y: number } | null>(null);

  // 외부에서 전달된 calendarDate가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    if (calendarDate) {
      setDate(calendarDate);
    }
  }, [calendarDate]);

  // Long press 타이머 정리
  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressTarget.current = null;
    setPressStart(null);
  }, []);

  // Long press 시작
  const handlePressStart = React.useCallback((e: React.PointerEvent, targetDate: Date) => {
    // 이미 스와이프 중이면 무시
    if (touchStart) return;

    setPressStart({ x: e.clientX, y: e.clientY });
    longPressTarget.current = targetDate;

    // 500ms 후 long press로 간주
    longPressTimer.current = setTimeout(() => {
      if (longPressTarget.current) {
        onDateDoubleClick(longPressTarget.current); // 일정 추가 모달 열기
        clearLongPressTimer();
      }
    }, 500);
  }, [touchStart, onDateDoubleClick, clearLongPressTimer]);

  // Long press 취소 (움직임 감지)
  const handlePressMove = React.useCallback((e: React.PointerEvent) => {
    if (!pressStart) return;

    const deltaX = Math.abs(e.clientX - pressStart.x);
    const deltaY = Math.abs(e.clientY - pressStart.y);

    // 10px 이상 움직이면 long press 취소
    if (deltaX > 10 || deltaY > 10) {
      clearLongPressTimer();
    }
  }, [pressStart, clearLongPressTimer]);

  // Long press 종료
  const handlePressEnd = React.useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

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

  // Long press 이벤트 리스너 추가
  useEffect(() => {
    if (!calendarRef.current) return;

    const tiles = calendarRef.current.querySelectorAll('.react-calendar__tile');

    const handleTilePointerDown = (e: PointerEvent, tile: Element) => {
      // 타일의 abbr 태그에서 날짜 추출
      const abbrElement = tile.querySelector('abbr');
      if (!abbrElement) return;

      const ariaLabel = abbrElement.getAttribute('aria-label');
      if (!ariaLabel) return;

      // aria-label 형식: "2025년 1월 5일" 등
      const dateMatch = ariaLabel.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
      if (!dateMatch) return;

      const [, year, month, day] = dateMatch;
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Long press 시작 (React 이벤트가 아니므로 변환)
      handlePressStart(e as unknown as React.PointerEvent, targetDate);
    };

    tiles.forEach((tile) => {
      const pointerDownListener = (e: Event) => handleTilePointerDown(e as PointerEvent, tile);
      tile.addEventListener('pointerdown', pointerDownListener);

      // cleanup을 위해 element에 listener 저장
      (tile as any)._pointerDownListener = pointerDownListener;
    });

    // Cleanup
    return () => {
      tiles.forEach((tile) => {
        if ((tile as any)._pointerDownListener) {
          tile.removeEventListener('pointerdown', (tile as any)._pointerDownListener);
          delete (tile as any)._pointerDownListener;
        }
      });
    };
  }, [date, schedules, handlePressStart]); // date와 schedules가 변경되면 타일도 재생성되므로 리스너 재등록

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

            // 정원 상태 계산 (3단계: 신청 가능 / 마감 또는 초과 / 신청 완료)
            const getCapacityStatus = () => {
              const { currentParticipants, maxCapacity } = schedule;
              if (isParticipating) return "capacity-participated";
              if (currentParticipants >= maxCapacity) return "capacity-full";
              return "capacity-available";
            };

            const capacityStatus = getCapacityStatus();

            // 대진 상태 결정
            const getDrawStatus = () => {
              if (hasInvalidDraw) return "draw-invalid";
              if (hasValidDraw) return "draw-valid";
              return "draw-none";
            };

            const drawStatus = getDrawStatus();

            return (
              <div
                key={schedule.id}
                className={`calendar-event ${
                  isPast ? "past-event" : ""
                } ${capacityStatus} ${drawStatus}`}
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
                  {format(new Date(schedule.scheduledAt), "HH")}
                </span>
                <span className="event-name">
                  <span className="event-name-text">
                    {schedule.courtName.replace(/\s+/g, '').substring(0, maxCourtNameLength)}
                  </span>
                  {drawStatus === "draw-valid" && (
                    <span className="draw-icon draw-icon-valid">✓</span>
                  )}
                  {drawStatus === "draw-invalid" && (
                    <span className="draw-icon draw-icon-invalid">⚠</span>
                  )}
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
    // Long press가 실행 중이면 클릭 무시
    if (longPressTimer.current) {
      clearLongPressTimer();
      return;
    }

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

    // 과거 날짜 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tileDate = new Date(date);
    tileDate.setHours(0, 0, 0, 0);

    if (tileDate < today) {
      classes.push("past-date");
    }

    if (isSunday(date)) {
      classes.push("holiday-sunday");
    }

    if (isHoliday(date)) {
      classes.push("holiday");
    }

    return classes.length > 0 ? classes.join(" ") : null;
  };

  // 월 변경 시 날짜 조정 (해당 월에 날짜가 없으면 마지막 날짜로)
  const adjustDateForMonth = (
    currentDate: Date,
    targetMonth: number,
    targetYear: number
  ): Date => {
    const currentDay = getDate(currentDate);
    const targetDate = new Date(targetYear, targetMonth, currentDay);

    // 해당 월에 현재 날짜가 유효한지 확인
    // (예: 1월 31일 -> 2월로 가면 2월 31일은 3월 3일로 변환되므로, 원하는 월과 다르면 마지막 날 사용)
    if (targetDate.getMonth() !== targetMonth) {
      // 해당 월의 마지막 날짜 사용
      return lastDayOfMonth(new Date(targetYear, targetMonth, 1));
    }

    return targetDate;
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (!value) return;
    const newDate = Array.isArray(value) ? value[0] : value;
    if (!(newDate instanceof Date)) return;

    // 애니메이션 효과를 위한 처리
    if (isAnimating) return;

    // 현재 선택된 날짜와 새 날짜의 월이 다른 경우 (월 변경)
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();

    let adjustedDate = newDate;

    // 월이 변경된 경우 날짜 조정
    if (currentMonth !== newMonth || currentYear !== newYear) {
      adjustedDate = adjustDateForMonth(date, newMonth, newYear);
    }

    setIsAnimating(true);
    setDate(adjustedDate);

    // 외부 상태도 업데이트
    if (onCalendarDateChange) {
      onCalendarDateChange(adjustedDate);
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
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();

      let targetMonth: number;
      let targetYear: number;

      if (deltaX > 0) {
        // 오른쪽으로 스와이프 = 이전 달
        setSlideDirection("right");
        targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      } else {
        // 왼쪽으로 스와이프 = 다음 달
        setSlideDirection("left");
        targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      }

      const adjustedDate = adjustDateForMonth(date, targetMonth, targetYear);
      handleDateChange(adjustedDate);
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
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();

      let targetMonth: number;
      let targetYear: number;

      if (deltaX > 0) {
        // 오른쪽으로 드래그 = 이전 달
        setSlideDirection("right");
        targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      } else {
        // 왼쪽으로 드래그 = 다음 달
        setSlideDirection("left");
        targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      }

      const adjustedDate = adjustDateForMonth(date, targetMonth, targetYear);
      handleDateChange(adjustedDate);
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
      onPointerMove={handlePressMove}
      onPointerUp={handlePressEnd}
      onPointerCancel={handlePressEnd}
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
          // 연도/월 네비게이션 버튼 클릭 시 상태 동기화
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              // 현재 선택된 날짜와 새 월이 다른 경우 날짜 조정
              const currentMonth = date.getMonth();
              const currentYear = date.getFullYear();
              const newMonth = activeStartDate.getMonth();
              const newYear = activeStartDate.getFullYear();

              let adjustedDate = activeStartDate;

              // 월이 변경된 경우 날짜 조정
              if (currentMonth !== newMonth || currentYear !== newYear) {
                adjustedDate = adjustDateForMonth(date, newMonth, newYear);
              }

              setDate(adjustedDate);
              if (onCalendarDateChange) {
                onCalendarDateChange(adjustedDate);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default ScheduleCalendarView;
