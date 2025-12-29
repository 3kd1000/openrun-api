import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { scheduleService } from '../../services/scheduleService';
import type { Schedule } from '../../types/schedule';
import ScheduleCreateModal from './components/ScheduleCreateModal';
import ScheduleCalendarView from './components/ScheduleCalendarView';
import ScheduleDetailModal from './components/ScheduleDetailModal';
import './ScheduleListPage.css';

type ViewMode = 'calendar' | 'list';

const ScheduleListPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [myParticipations, setMyParticipations] = useState<Set<number>>(new Set());
  const todayScheduleRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const loadSchedules = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError('');

      // 일정 목록 조회
      const data = await scheduleService.getAllSchedules();
      // 일정날짜순으로 정렬 (오름차순)
      const sortedData = data.sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      setSchedules(sortedData);

      // 내가 참여한 일정 목록 조회 (로그인한 경우에만)
      const userId = localStorage.getItem('user_id');
      if (userId) {
        const participationIds = await scheduleService.getMyParticipations(parseInt(userId));
        setMyParticipations(new Set(participationIds));
      }
    } catch (err) {
      console.error('일정 조회 실패:', err);
      setError('일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 리스트뷰에서 오늘 날짜 기준으로 스크롤
  useEffect(() => {
    if (viewMode === 'list' && !filterDate && todayScheduleRef.current) {
      setTimeout(() => {
        todayScheduleRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [viewMode, schedules, filterDate]);

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

  const handleDateClick = (date: Date) => {
    // 단일 클릭: 리스트뷰로 전환 + 해당 날짜로 필터링
    setFilterDate(date);
    setViewMode('list');
  };

  const handleDateDoubleClick = (date: Date) => {
    // 더블클릭: 일정 생성 모달
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedScheduleId(schedule.id);
    setShowDetailModal(true);
  };

  const handleClearFilter = () => {
    setFilterDate(null);
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setSelectedDate(null);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedScheduleId(null);
  };

  // 필터링된 일정 목록
  const filteredSchedules = filterDate
    ? schedules.filter(schedule =>
        format(new Date(schedule.scheduledAt), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd')
      )
    : schedules;

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>일정 관리</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('calendar');
                setFilterDate(null);
              }}
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

      {filterDate && viewMode === 'list' && (
        <div className="filter-info">
          <span>{format(filterDate, 'yyyy년 M월 d일')} 일정</span>
          <button className="btn-clear-filter" onClick={handleClearFilter}>전체 보기</button>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <ScheduleCalendarView
          schedules={schedules}
          onDateClick={handleDateClick}
          onDateDoubleClick={handleDateDoubleClick}
          onScheduleClick={handleScheduleClick}
          myParticipations={myParticipations}
        />
      ) : filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <p>📅</p>
          <p>등록된 일정이 없습니다.</p>
          <p className="empty-hint">새로운 일정을 생성해보세요!</p>
        </div>
      ) : (
        <div className="schedule-list">
          {filteredSchedules.map((schedule, index) => {
            const isPast = new Date(schedule.scheduledAt) < new Date();
            const isFirstFuture = !isPast && filteredSchedules.slice(0, index).every(s => new Date(s.scheduledAt) < new Date());
            const isParticipating = myParticipations.has(schedule.id);
            const hasInvalidDraw = schedule.drawType && !schedule.isDrawValid;
            const hasValidDraw = schedule.drawType && schedule.isDrawValid;
            return (
              <div
                key={schedule.id}
                ref={isFirstFuture ? todayScheduleRef : null}
                className={`schedule-card ${isPast ? 'past-schedule' : ''} ${!isParticipating ? 'not-participating' : ''} ${hasInvalidDraw ? 'invalid-draw' : ''} ${hasValidDraw ? 'has-valid-draw' : ''}`}
                onClick={() => handleScheduleClick(schedule)}
              >
              {hasInvalidDraw && (
                <div className="draw-warning">
                  ⚠️ 대진표 무효 (참가자 변동)
                </div>
              )}
              {hasValidDraw && (
                <div className="draw-success">
                  ✓ 대진표 생성 완료
                </div>
              )}
              <div className="schedule-info">
                <h3>{schedule.courtName}</h3>
                {schedule.reservedByUserName && (
                  <p className="schedule-reserved-by">예약자: {schedule.reservedByUserName}</p>
                )}
                <p className="schedule-time">
                  {new Date(schedule.scheduledAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="schedule-participants">
                  <span className="stat-confirmed">신청 {schedule.currentParticipants}명</span>
                  <span className="stat-divider">/</span>
                  <span className="stat-total">총원 {schedule.maxCapacity}명</span>
                </div>
                {schedule.cost && (
                  <p className="schedule-cost">{schedule.cost.toLocaleString()}원</p>
                )}
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <ScheduleCreateModal
          initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
          onClose={handleCreateModalClose}
          onSuccess={() => {
            loadSchedules();
          }}
        />
      )}

      {showDetailModal && selectedScheduleId && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          onClose={handleDetailModalClose}
          onSuccess={() => {
            loadSchedules();
          }}
        />
      )}
    </div>
  );
};

export default ScheduleListPage;
