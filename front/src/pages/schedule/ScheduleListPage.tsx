import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { scheduleService } from '../../services/scheduleService';
import type { Schedule } from '../../types/schedule';
import ScheduleCreateModal from './components/ScheduleCreateModal';
import ScheduleCalendarView from './components/ScheduleCalendarView';
import './ScheduleListPage.css';

type ViewMode = 'calendar' | 'list';

const ScheduleListPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await scheduleService.getAllSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('일정 조회 실패:', err);
      setError('일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="schedule-page"><div className="loading">로딩 중...</div></div>;
  }

  if (error) {
    return (
      <div className="schedule-page">
        <div className="error-state">
          <p>⚠️</p>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadSchedules}>다시 시도</button>
        </div>
      </div>
    );
  }

  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    // TODO: 일정 상세 모달 (나중에 구현)
    console.log('Schedule clicked:', schedule);
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setSelectedDate(null);
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>일정 관리</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 캘린더
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 리스트
            </button>
          </div>
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>+ 일정 생성</button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <ScheduleCalendarView
          schedules={schedules}
          onDateDoubleClick={handleDateDoubleClick}
          onScheduleClick={handleScheduleClick}
        />
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <p>📅</p>
          <p>등록된 일정이 없습니다.</p>
          <p className="empty-hint">새로운 일정을 생성해보세요!</p>
        </div>
      ) : (
        <div className="schedule-list">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-card">
              <div className="schedule-info">
                <h3>{schedule.courtName}</h3>
                <p className="schedule-time">
                  {new Date(schedule.scheduledAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="schedule-participants">
                  {schedule.currentParticipants} / {schedule.maxCapacity}명
                  {schedule.currentParticipants >= schedule.maxCapacity && (
                    <span className="badge-full"> 마감</span>
                  )}
                </p>
                {schedule.cost && (
                  <p className="schedule-cost">{schedule.cost.toLocaleString()}원</p>
                )}
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ScheduleCreateModal
          initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : undefined}
          onClose={handleCreateModalClose}
          onSuccess={() => {
            loadSchedules();
          }}
        />
      )}
    </div>
  );
};

export default ScheduleListPage;
