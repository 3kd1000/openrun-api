import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import type { Match } from '../../types/match';
import { format } from 'date-fns';
import './DrawListPage.css';

const DrawListPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 검색 필터
  const [playerName, setPlayerName] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '1week' | '1month' | '3months'>('all');

  const clubId = 1; // TODO: Context나 URL param에서 가져오기

  useEffect(() => {
    fetchMatches();
  }, [dateRange]);

  const fetchMatches = async (searchPlayerName?: string) => {
    try {
      setLoading(true);
      setError(null);

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
      setError('대진 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const getResultDisplay = (match: Match) => {
    if (!match.result) return '-';
    if (match.result === 'TEAM_A_WIN') return `${match.teamAScore}-${match.teamBScore} (A팀 승)`;
    if (match.result === 'TEAM_B_WIN') return `${match.teamAScore}-${match.teamBScore} (B팀 승)`;
    return `${match.teamAScore}-${match.teamBScore} (무승부)`;
  };

  if (loading) {
    return (
      <div className="draw-list-page">
        <div className="page-header">
          <h1>대진 목록</h1>
        </div>
        <div className="empty-state">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="draw-list-page">
        <div className="page-header">
          <h1>대진 목록</h1>
        </div>
        <div className="empty-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="draw-list-page">
      <div className="page-header">
        <h1>대진 목록</h1>
        <p className="page-description">일정별로 생성된 대진표를 확인하고 경기 결과를 입력하세요</p>
      </div>

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
        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>대진이 없습니다</h3>
            <p>검색 조건을 변경하거나 일정 관리에서 대진표를 생성해보세요</p>
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
  );
};

export default DrawListPage;
