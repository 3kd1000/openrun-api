import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import type { Schedule } from '../../../types/schedule';
import 'react-calendar/dist/Calendar.css';
import './ScheduleCalendarView.css';

interface Props {
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  onDateDoubleClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  myParticipations: Set<number>;
}

const ScheduleCalendarView: React.FC<Props> = ({
  schedules,
  onDateClick,
  onDateDoubleClick,
  onScheduleClick,
  myParticipations
}) => {
  const [date, setDate] = useState(new Date());
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // 특정 날짜의 일정들 가져오기
  const getSchedulesForDate = (date: Date): Schedule[] => {
    return schedules.filter(schedule =>
      isSameDay(new Date(schedule.scheduledAt), date)
    );
  };

  // 타일 콘텐츠 렌더링
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const daySchedules = getSchedulesForDate(date);

      if (daySchedules.length === 0) return null;

      return (
        <div className="calendar-tile-content">
          {daySchedules.slice(0, 3).map((schedule) => {
            const isPast = new Date(schedule.scheduledAt) < new Date();
            const isParticipating = myParticipations.has(schedule.id);
            const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
            return (
              <div
                key={schedule.id}
                className={`calendar-event ${isPast ? 'past-event' : ''} ${!isParticipating ? 'not-participating' : ''} ${hasInvalidDraw ? 'invalid-draw' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleClick(schedule);
                }}
                title={`${schedule.courtName} - ${format(new Date(schedule.scheduledAt), 'HH:mm')}${hasInvalidDraw ? ' ⚠️ 대진표 무효' : ''}`}
              >
              <span className="event-time">
                {format(new Date(schedule.scheduledAt), 'HH:mm')}
              </span>
              <span className="event-name">
                {schedule.courtName}
                {hasInvalidDraw && <span className="invalid-indicator">⚠️</span>}
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

  return (
    <div className="calendar-view">
      <Calendar
        value={date}
        onChange={(value) => setDate(value as Date)}
        tileContent={tileContent}
        locale="ko-KR"
        calendarType="gregory"
        formatDay={(locale, date) => format(date, 'd')}
        onClickDay={handleTileClick}
        showNeighboringMonth={false}
      />
    </div>
  );
};

export default ScheduleCalendarView;
