import React, { useEffect, useState } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import './ScoreboardPage.css';

interface RankingEntry {
  rank: number;
  userId: number;
  userName: string;
  totalMatches: number;
  points: number;
  winRate: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  totalPointsScored: number;
  totalPointsConceded: number;
}

interface ScoreboardResponse {
  rankings: RankingEntry[];
}

const ScoreboardPage: React.FC = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 컬럼 표시 여부 (득실, 득점, 실점은 초기 false)
  const [showGoalDiff, setShowGoalDiff] = useState(false);
  const [showScored, setShowScored] = useState(false);
  const [showConceded, setShowConceded] = useState(false);

  const clubId = 1; // TODO: Context나 URL param에서 가져오기

  useEffect(() => {
    fetchScoreboard();
  }, []);

  const fetchScoreboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<ScoreboardResponse>(
        `/clubs/${clubId}/scoreboard`
      );
      setRankings(response.data.rankings);
    } catch (err) {
      console.error('Failed to fetch scoreboard:', err);
      setError('스코어보드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="scoreboard-page">
        <div className="scoreboard-header">
          <h1>스코어보드</h1>
        </div>
        <div className="empty-state">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scoreboard-page">
        <div className="scoreboard-header">
          <h1>스코어보드</h1>
        </div>
        <div className="empty-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="scoreboard-page">
        <div className="scoreboard-header">
          <h1>스코어보드</h1>
        </div>
        <div className="empty-state">
          <p>🏆</p>
          <p>아직 경기 기록이 없습니다.</p>
          <p className="empty-hint">경기를 등록하면 랭킹이 표시됩니다!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard-page">
      <div className="scoreboard-header">
        <h1>스코어보드</h1>
        <p className="subtitle">승점 순위</p>
      </div>

      {/* 컬럼 표시 옵션 */}
      <div className="column-options">
        <label>
          <input
            type="checkbox"
            checked={showGoalDiff}
            onChange={(e) => setShowGoalDiff(e.target.checked)}
          />
          득실차
        </label>
        <label>
          <input
            type="checkbox"
            checked={showScored}
            onChange={(e) => setShowScored(e.target.checked)}
          />
          득점
        </label>
        <label>
          <input
            type="checkbox"
            checked={showConceded}
            onChange={(e) => setShowConceded(e.target.checked)}
          />
          실점
        </label>
      </div>

      {/* 스코어보드 테이블 */}
      <div className="scoreboard-table-container">
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>이름</th>
              <th>경기수</th>
              <th>승점</th>
              <th>승률</th>
              <th>승</th>
              <th>무</th>
              <th>패</th>
              {showGoalDiff && <th>득실</th>}
              {showScored && <th>득점</th>}
              {showConceded && <th>실점</th>}
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry) => (
              <tr key={entry.userId}>
                <td className="rank">{entry.rank}</td>
                <td className="name">{entry.userName}</td>
                <td>{entry.totalMatches}</td>
                <td className="points">{entry.points}</td>
                <td>{entry.winRate.toFixed(2)}%</td>
                <td className="wins">{entry.wins}</td>
                <td>{entry.draws}</td>
                <td>{entry.losses}</td>
                {showGoalDiff && (
                  <td className={entry.goalDifference >= 0 ? 'positive' : 'negative'}>
                    {entry.goalDifference > 0 ? '+' : ''}
                    {entry.goalDifference}
                  </td>
                )}
                {showScored && <td>{entry.totalPointsScored}</td>}
                {showConceded && <td>{entry.totalPointsConceded}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreboardPage;
