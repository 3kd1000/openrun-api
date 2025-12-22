import React, { useState, useEffect } from 'react';
import { drawService } from '../../../services/drawService';
import type { DrawResponse } from '../../../services/drawService';
import type { Schedule, Participant } from '../../../types/schedule';
import DrawCreateModal from './DrawCreateModal';
import './DrawViewModal.css';

interface Props {
  schedule: Schedule;
  participants: Participant[];
  onClose: () => void;
  onSuccess: () => void;
}

const DrawViewModal: React.FC<Props> = ({ schedule, participants, onClose, onSuccess }) => {
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  useEffect(() => {
    loadDraw();
  }, [schedule.id]);

  const loadDraw = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await drawService.getDraw(schedule.id);
      setDrawResult(result);
    } catch (err: any) {
      console.error('대진표 조회 실패:', err);
      setError(err.response?.data?.message || '대진표를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 대진표 텍스트로 포맷팅
  const formatDrawAsText = (): string => {
    if (!drawResult) return '';
    let text = `🎯 ${schedule.courtName} 대진표\n`;
    text += `📅 ${new Date(schedule.scheduledAt).toLocaleString('ko-KR')}\n`;
    text += `대진 타입: ${schedule.drawType}\n\n`;

    drawResult.games.forEach(game => {
      text += `경기 ${game.gameNo} (${game.roundNo}R)\n`;
      text += `  Team A: ${game.teamA.join(', ')}\n`;
      text += `  Team B: ${game.teamB.join(', ')}\n\n`;
    });

    return text;
  };

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatDrawAsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleRegenerateSuccess = () => {
    setShowRegenerateModal(false);
    loadDraw(); // 대진표 다시 로드
    onSuccess(); // 부모 컴포넌트에도 알림
  };

  if (showRegenerateModal) {
    return (
      <DrawCreateModal
        scheduleId={schedule.id}
        participants={participants}
        onClose={() => setShowRegenerateModal(false)}
        onSuccess={handleRegenerateSuccess}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content draw-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 대진표</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="draw-view-content">
          {/* 일정 정보 */}
          <div className="schedule-info-section">
            <h3>{schedule.courtName}</h3>
            <p className="schedule-datetime">
              {new Date(schedule.scheduledAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <div className="draw-type-badge">
              대진 타입: {schedule.drawType}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">대진표를 불러오는 중...</div>
          ) : drawResult ? (
            <div className="draw-result-section">
              <div className="draw-games-list">
                {drawResult.games.map(game => (
                  <div key={game.gameNo} className="draw-game-card">
                    <div className="game-header">
                      <span className="game-number">경기 {game.gameNo}</span>
                      <span className="round-badge">{game.roundNo}R</span>
                    </div>
                    <div className="game-teams">
                      <div className="team team-a">
                        <div className="team-label">Team A</div>
                        <div className="team-players">
                          {game.teamA.map((player, idx) => (
                            <span key={idx} className="player-name">{player}</span>
                          ))}
                        </div>
                      </div>
                      <div className="vs-divider">VS</div>
                      <div className="team team-b">
                        <div className="team-label">Team B</div>
                        <div className="team-players">
                          {game.teamB.map((player, idx) => (
                            <span key={idx} className="player-name">{player}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 액션 버튼 */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-copy"
              disabled={!drawResult}
            >
              {copied ? '✓ 복사됨' : '📋 복사'}
            </button>
            <button
              type="button"
              onClick={() => setShowRegenerateModal(true)}
              className="btn-regenerate"
              disabled={!drawResult}
            >
              🔄 재생성
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawViewModal;
