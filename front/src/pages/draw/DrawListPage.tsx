import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import { scheduleService } from '../../services/scheduleService';
import { participantService } from '../../services/participantService';
import type { Match } from '../../types/match';
import type { Schedule, Participant } from '../../types/schedule';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import DrawViewModal from '../schedule/components/DrawViewModal';
import './DrawListPage.css';

type TabType = 'schedules' | 'matches';

const DrawListPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('schedules');

  // Tab 1: Schedules with draws
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Tab 2: Match search
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // 검색 필터 (Tab 2)
  const [playerName, setPlayerName] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '1week' | '1month' | '3months'>('all');

  // DrawViewModal state
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const clubId = 1; // TODO: Context나 URL param에서 가져오기

  // Tab 1: Load schedules with draws on mount
  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchSchedulesWithDraws();
    }
  }, [activeTab]);

  // Tab 1: Fetch schedules that have draws
  const fetchSchedulesWithDraws = async () => {
    try {
      setSchedulesLoading(true);
      setSchedulesError(null);

      const allSchedules = await scheduleService.getSchedulesByClubId(clubId);

      // Filter schedules that have drawType (대진이 생성된 일정만)
      const schedulesWithDraws = allSchedules.filter(schedule => schedule.drawType != null);

      // Sort by scheduled date (latest first)
      schedulesWithDraws.sort((a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      setSchedules(schedulesWithDraws);
    } catch (err) {
      console.error('Failed to fetch schedules with draws:', err);
      setSchedulesError('대진이 있는 일정을 불러오는데 실패했습니다.');
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Tab 2: Fetch matches
  const fetchMatches = async (searchPlayerName?: string) => {
    try {
      setMatchesLoading(true);
      setMatchesError(null);

      // 기간 계산
      let startDate: string | undefined;
      const endDate = new Date().toISOString();

      if (dateRange === '1week') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        startDate = date.toISOString();
      } else if (dateRange === '1month') {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        startDate = date.toISOString();
      } else if (dateRange === '3months') {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        startDate = date.toISOString();
      }

      // API 호출
      const params: any = {};
      if (searchPlayerName) params.playerName = searchPlayerName;
      if (startDate) params.startDate = startDate;
      if (dateRange !== 'all') params.endDate = endDate;

      const response = await axiosInstance.get<Match[]>(
        `/clubs/${clubId}/matches`,
        { params }
      );

      setMatches(response.data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setMatchesError('대진 목록을 불러오는데 실패했습니다.');
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(playerName || undefined);
  };

  const handleReset = () => {
    setPlayerName('');
    setDateRange('all');
    fetchMatches();
  };

  // Schedule click handler - open DrawViewModal
  const handleScheduleClick = async (schedule: Schedule) => {
    try {
      // Fetch participants for this schedule
      const participantsList = await participantService.getParticipants(schedule.id);
      setParticipants(participantsList);
      setSelectedSchedule(schedule);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  };

  const handleCloseDrawModal = () => {
    setSelectedSchedule(null);
    setParticipants([]);
  };

  const handleDrawModalSuccess = () => {
    fetchSchedulesWithDraws(); // Refresh schedule list
  };

  const getResultDisplay = (match: Match) => {
    if (!match.result) return '-';
    if (match.result === 'TEAM_A_WIN') return `${match.teamAScore}-${match.teamBScore} (A팀 승)`;
    if (match.result === 'TEAM_B_WIN') return `${match.teamAScore}-${match.teamBScore} (B팀 승)`;
    return `${match.teamAScore}-${match.teamBScore} (무승부)`;
  };

  return (
    <div className="draw-list-page">
      <div className="page-header">
        <h1>대진 목록</h1>
        <p className="page-description">일정별로 생성된 대진표를 확인하고 경기 결과를 검색하세요</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          📅 일정별 대진
        </button>
        <button
          className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          🔍 대진 기록 검색
        </button>
      </div>

      {/* Tab 1: Schedules with Draws */}
      {activeTab === 'schedules' && (
        <div className="tab-content">
          {schedulesLoading ? (
            <div className="empty-state">
              <p>로딩 중...</p>
            </div>
          ) : schedulesError ? (
            <div className="empty-state">
              <p>❌ {schedulesError}</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>생성된 대진이 없습니다</h3>
              <p>일정 관리에서 일정을 만들고 대진표를 생성해보세요</p>
            </div>
          ) : (
            <div className="schedule-list">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="schedule-card"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  <div className="schedule-header">
                    <h3 className="schedule-court">{schedule.courtName}</h3>
                    <span className={`draw-type-badge ${schedule.drawType?.toLowerCase()}`}>
                      {schedule.drawType}
                    </span>
                  </div>
                  <div className="schedule-datetime">
                    📅 {format(new Date(schedule.scheduledAt), 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })}
                  </div>
                  <div className="schedule-info">
                    <span className="info-item">
                      👥 {schedule.currentParticipants}/{schedule.maxCapacity}명
                    </span>
                    {schedule.cost && (
                      <span className="info-item">
                        💰 {schedule.cost.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <div className={`draw-validity ${schedule.isDrawValid ? 'valid' : 'invalid'}`}>
                    {schedule.isDrawValid ? (
                      <>✓ 유효한 대진표</>
                    ) : (
                      <>⚠️ 재생성 필요</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Match Search */}
      {activeTab === 'matches' && (
        <div className="tab-content">
          {/* 검색 필터 */}
          <div className="filter-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="선수 이름 검색"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">검색</button>
          <button type="button" onClick={handleReset} className="reset-button">초기화</button>
        </form>

        <div className="date-range-filter">
          <label>기간:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
            <option value="all">전체</option>
            <option value="1week">1주일</option>
            <option value="1month">1개월</option>
            <option value="3months">3개월</option>
          </select>
        </div>
      </div>

          {/* 대진 목록 */}
          <div className="match-list-container">
            {matchesLoading ? (
              <div className="empty-state">
                <p>로딩 중...</p>
              </div>
            ) : matchesError ? (
              <div className="empty-state">
                <p>❌ {matchesError}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>검색 결과가 없습니다</h3>
                <p>선수 이름이나 기간을 입력하여 경기 기록을 검색해보세요</p>
              </div>
            ) : (
              <div className="match-list">
                {matches.map((match) => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <span className="match-number">#{match.matchNumber}</span>
                      <span className="match-date">
                        {format(new Date(match.playedAt), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="match-teams">
                      <div className="team">
                        <div className="team-label">A팀</div>
                        <div className="players">
                          {match.teamAPlayer1Name}
                          {match.teamAPlayer2Name && ` / ${match.teamAPlayer2Name}`}
                        </div>
                      </div>
                      <div className="vs">VS</div>
                      <div className="team">
                        <div className="team-label">B팀</div>
                        <div className="players">
                          {match.teamBPlayer1Name}
                          {match.teamBPlayer2Name && ` / ${match.teamBPlayer2Name}`}
                        </div>
                      </div>
                    </div>
                    <div className="match-result">
                      <span className="result-label">결과:</span>
                      <span className="result-value">{getResultDisplay(match)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DrawViewModal */}
      {selectedSchedule && (
        <DrawViewModal
          schedule={selectedSchedule}
          participants={participants}
          onClose={handleCloseDrawModal}
          onSuccess={handleDrawModalSuccess}
        />
      )}
    </div>
  );
};

export default DrawListPage;
