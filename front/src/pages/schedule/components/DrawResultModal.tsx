import React, { useState } from 'react';
import type { DrawResponse } from '../../../services/drawService';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import './DrawResultModal.css';

interface Props {
  scheduleId: number;
  drawResult: DrawResponse;
  onClose: () => void;
  onRegenerate: () => void;
}

const DrawResultModal: React.FC<Props> = ({ scheduleId, drawResult, onClose, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  // ESC 키로 모달 닫기
  useEscapeKey(onClose);

  // 대진표 텍스트로 포맷팅
  const formatDrawAsText = (): string => {
    let text = '🎯 대진표\n\n';

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content draw-result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 대진표 생성 완료</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="draw-result-content">
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

          <div className="draw-actions">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-copy"
            >
              {copied ? '✓ 복사됨' : '📋 복사하기'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegenerate();
              }}
              className="btn-regenerate"
            >
              🔄 다시 생성
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

export default DrawResultModal;
