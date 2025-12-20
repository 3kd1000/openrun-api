import React from 'react';
import './ScoreboardPage.css';

const ScoreboardPage: React.FC = () => {
  return (
    <div className="scoreboard-page">
      <div className="scoreboard-header">
        <h1>스코어보드</h1>
      </div>

      <div className="empty-state">
        <p>🏆</p>
        <p>스코어보드 기능 준비 중입니다.</p>
        <p className="empty-hint">곧 만나보실 수 있습니다!</p>
      </div>
    </div>
  );
};

export default ScoreboardPage;
