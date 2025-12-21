import React, { useState } from 'react';
import { DEV_USERS } from '../../../components/DevUserSwitcher';
import type { Participant } from '../../../types/schedule';
import { drawService } from '../../../services/drawService';
import type { DrawResponse } from '../../../services/drawService';
import './DrawCreateModal.css';

interface Props {
  scheduleId: number;
  participants: Participant[];
  onClose: () => void;
  onSuccess: (drawResult: DrawResponse) => void;
}

type DrawType = 'AA' | 'AB' | 'SEED';

const DrawCreateModal: React.FC<Props> = ({ scheduleId, participants, onClose, onSuccess }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    participants.filter(p => p.status === 'CONFIRMED').map(p => p.userId)
  );
  const [drawType, setDrawType] = useState<DrawType>('AA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 사용자 ID로 이름 가져오기
  const getUserName = (userId: number): string => {
    const user = DEV_USERS.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  // 참가자 선택/해제 토글
  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // 대진 생성
  const handleCreateDraw = async () => {
    if (selectedUserIds.length < 4) {
      setError('최소 4명의 참가자가 필요합니다.');
      return;
    }

    if (selectedUserIds.length % 2 !== 0) {
      setError('참가자 수는 짝수여야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 선택된 사용자들의 이름 가져오기
      const userNames = selectedUserIds.map(id => getUserName(id));

      // 대진 생성 요청
      const drawResult = await drawService.createDrawWithSchedule(scheduleId, {
        userNames,
        drawType,
        numberOfTotalPlayer: selectedUserIds.length
      });

      // 성공 시 결과 전달
      onSuccess(drawResult);
      onClose();

    } catch (err: any) {
      console.error('대진 생성 실패:', err);
      setError(err.response?.data?.message || '대진 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const confirmedParticipants = participants.filter(p => p.status === 'CONFIRMED');
  const waitingParticipants = participants.filter(p => p.status === 'WAITING');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content draw-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>대진 생성</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="draw-create-content">
          {error && <div className="error-message">{error}</div>}

          {/* 대진 타입 선택 */}
          <div className="form-group">
            <label>대진 타입</label>
            <div className="draw-type-buttons">
              <button
                type="button"
                className={`draw-type-btn ${drawType === 'AA' ? 'active' : ''}`}
                onClick={() => setDrawType('AA')}
              >
                AA (랜덤)
              </button>
              <button
                type="button"
                className={`draw-type-btn ${drawType === 'AB' ? 'active' : ''}`}
                onClick={() => setDrawType('AB')}
              >
                AB (그룹별)
              </button>
              <button
                type="button"
                className={`draw-type-btn ${drawType === 'SEED' ? 'active' : ''}`}
                onClick={() => setDrawType('SEED')}
              >
                SEED (시드)
              </button>
            </div>
          </div>

          {/* 참가자 선택 */}
          <div className="form-group">
            <label>
              참가자 선택 ({selectedUserIds.length}명 선택)
              {selectedUserIds.length % 2 !== 0 && (
                <span className="warning-text"> ⚠️ 짝수여야 합니다</span>
              )}
            </label>

            {/* 확정 참가자 */}
            {confirmedParticipants.length > 0 && (
              <div className="participant-selection-group">
                <h4>확정 ({confirmedParticipants.length}명)</h4>
                <div className="participant-checkboxes">
                  {confirmedParticipants.map(p => (
                    <label key={p.id} className="participant-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(p.userId)}
                        onChange={() => toggleUserSelection(p.userId)}
                      />
                      <span>{getUserName(p.userId)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 대기 참가자 */}
            {waitingParticipants.length > 0 && (
              <div className="participant-selection-group">
                <h4>대기 ({waitingParticipants.length}명)</h4>
                <div className="participant-checkboxes">
                  {waitingParticipants.map(p => (
                    <label key={p.id} className="participant-checkbox waiting">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(p.userId)}
                        onChange={() => toggleUserSelection(p.userId)}
                      />
                      <span>{getUserName(p.userId)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreateDraw}
              className="btn-primary"
              disabled={loading || selectedUserIds.length < 4 || selectedUserIds.length % 2 !== 0}
            >
              {loading ? '생성 중...' : '대진 생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawCreateModal;
