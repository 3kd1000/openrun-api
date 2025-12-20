import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import type { Schedule } from '../../../types/schedule';
import 'react-calendar/dist/Calendar.css';
import './ScheduleCalendarView.css';

interface Props {
  schedules: Schedule[];
  onDateDoubleClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
}

const ScheduleCalendarView: React.FC<Props> = ({
  schedules,
  onDateDoubleClick,
  onScheduleClick
}) => {
  const [date, setDate] = useState(new Date());

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
          {daySchedules.slice(0, 3).map((schedule) => (
            <div
              key={schedule.id}
              className="calendar-event"
              onClick={(e) => {
                e.stopPropagation();
                onScheduleClick(schedule);
              }}
              title={`${schedule.courtName} - ${format(new Date(schedule.scheduledAt), 'HH:mm')}`}
            >
              <span className="event-time">
                {format(new Date(schedule.scheduledAt), 'HH:mm')}
              </span>
              <span className="event-name">{schedule.courtName}</span>
            </div>
          ))}
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

  // 타일 더블클릭 핸들러
  const handleTileDoubleClick = (date: Date) => {
    onDateDoubleClick(date);
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
        onClickDay={handleTileDoubleClick}
        showNeighboringMonth={false}
      />
    </div>
  );
};

export default ScheduleCalendarView;
