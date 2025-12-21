import React, { useState, useEffect } from 'react';
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
  const confirmedUserIds = participants.filter(p => p.status === 'CONFIRMED').map(p => p.userId);

  const [drawType, setDrawType] = useState<DrawType>('AA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AB 타입: 그룹 A/B
  const [groupA, setGroupA] = useState<number[]>([]);
  const [groupB, setGroupB] = useState<number[]>([]);

  // SEED 타입: 시드/일반
  const [seedPlayers, setSeedPlayers] = useState<number[]>([]);
  const [normalPlayers, setNormalPlayers] = useState<number[]>([]);

  // 드래그 상태
  const [draggedUser, setDraggedUser] = useState<number | null>(null);

  // 사용자 ID로 이름 가져오기
  const getUserName = (userId: number): string => {
    const user = DEV_USERS.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  // SEED 타입의 시드 수 계산
  const getSeedCount = (total: number): number => {
    if (total >= 6 && total <= 8) return 2;
    if (total > 8 && total <= 10) return 3;
    if (total > 10 && total <= 14) return 4;
    if (total === 15) return 5;
    if (total === 16) return 6;
    return 0;
  };

  // 대진 타입 변경 시 초기화
  useEffect(() => {
    const totalCount = confirmedUserIds.length;
    const half = Math.ceil(totalCount / 2);

    if (drawType === 'AB') {
      // AB: 반반 나누기
      setGroupA(confirmedUserIds.slice(0, half));
      setGroupB(confirmedUserIds.slice(half));
      setSeedPlayers([]);
      setNormalPlayers([]);
    } else if (drawType === 'SEED') {
      // SEED: 시드 수에 맞춰 분할
      const seedCount = getSeedCount(totalCount);
      setSeedPlayers(confirmedUserIds.slice(0, seedCount));
      setNormalPlayers(confirmedUserIds.slice(seedCount));
      setGroupA([]);
      setGroupB([]);
    } else {
      // AA: 초기화
      setGroupA([]);
      setGroupB([]);
      setSeedPlayers([]);
      setNormalPlayers([]);
    }
  }, [drawType]);

  // 드래그 시작
  const handleDragStart = (userId: number) => {
    setDraggedUser(userId);
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 터치 시작 (모바일)
  const handleTouchStart = (userId: number) => {
    setDraggedUser(userId);
  };

  // 터치 종료 (모바일)
  const handleTouchEnd = (e: React.TouchEvent, targetGroup: 'A' | 'B' | 'SEED' | 'NORMAL') => {
    e.preventDefault();
    if (!draggedUser) return;

    if (targetGroup === 'A' || targetGroup === 'B') {
      handleDropToGroup(targetGroup);
    } else {
      handleDropToSeedGroup(targetGroup);
    }
  };

  // AB: 그룹 간 이동
  const handleDropToGroup = (targetGroup: 'A' | 'B') => {
    if (!draggedUser) return;

    if (targetGroup === 'A') {
      if (!groupA.includes(draggedUser)) {
        setGroupA([...groupA, draggedUser]);
        setGroupB(groupB.filter(id => id !== draggedUser));
      }
    } else {
      if (!groupB.includes(draggedUser)) {
        setGroupB([...groupB, draggedUser]);
        setGroupA(groupA.filter(id => id !== draggedUser));
      }
    }
    setDraggedUser(null);
  };

  // SEED: 시드/일반 간 이동
  const handleDropToSeedGroup = (targetGroup: 'SEED' | 'NORMAL') => {
    if (!draggedUser) return;

    if (targetGroup === 'SEED') {
      if (!seedPlayers.includes(draggedUser)) {
        setSeedPlayers([...seedPlayers, draggedUser]);
        setNormalPlayers(normalPlayers.filter(id => id !== draggedUser));
      }
    } else {
      if (!normalPlayers.includes(draggedUser)) {
        setNormalPlayers([...normalPlayers, draggedUser]);
        setSeedPlayers(seedPlayers.filter(id => id !== draggedUser));
      }
    }
    setDraggedUser(null);
  };

  // 대진 생성
  const handleCreateDraw = async () => {
    try {
      setLoading(true);
      setError('');

      let request: any = {
        drawType,
        numberOfTotalPlayer: confirmedUserIds.length
      };

      if (drawType === 'AA') {
        request.userNames = confirmedUserIds.map(id => getUserName(id));
        request.seedUserNames = [];
        request.groupAUserNames = [];
        request.groupBUserNames = [];
      } else if (drawType === 'AB') {
        request.userNames = [...groupA, ...groupB].map(id => getUserName(id));
        request.groupAUserNames = groupA.map(id => getUserName(id));
        request.groupBUserNames = groupB.map(id => getUserName(id));
        request.seedUserNames = [];
      } else if (drawType === 'SEED') {
        request.userNames = normalPlayers.map(id => getUserName(id));
        request.seedUserNames = seedPlayers.map(id => getUserName(id));
        request.groupAUserNames = [];
        request.groupBUserNames = [];
      }

      const drawResult = await drawService.createDrawWithSchedule(scheduleId, request);
      onSuccess(drawResult);
      onClose();

    } catch (err: any) {
      console.error('대진 생성 실패:', err);
      setError(err.response?.data?.message || '대진 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 현재 선택된 총 인원
  const totalSelected = drawType === 'AB'
    ? groupA.length + groupB.length
    : drawType === 'SEED'
    ? seedPlayers.length + normalPlayers.length
    : confirmedUserIds.length;

  // 유효성 검사
  const isValid = totalSelected >= 4 && totalSelected % 2 === 0 &&
    (drawType === 'AB' ? groupA.length > 0 && groupB.length > 0 : true) &&
    (drawType === 'SEED' ? seedPlayers.length > 0 && normalPlayers.length > 0 : true);

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

          {/* AA 타입: 참가자 목록만 표시 */}
          {drawType === 'AA' && (
            <div className="participants-display">
              <h4>참가자 ({confirmedUserIds.length}명)</h4>
              <div className="player-grid">
                {confirmedUserIds.map(userId => (
                  <div key={userId} className="player-card">
                    {getUserName(userId)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AB 타입: 그룹 A/B 분할 */}
          {drawType === 'AB' && (
            <div className="group-division">
              <div
                className="group-box group-a"
                onDragOver={handleDragOver}
                onDrop={() => handleDropToGroup('A')}
                onTouchEnd={(e) => handleTouchEnd(e, 'A')}
              >
                <h4>그룹 A ({groupA.length}명)</h4>
                <div className="player-grid">
                  {groupA.map(userId => (
                    <div
                      key={userId}
                      className="player-card draggable"
                      draggable
                      onDragStart={() => handleDragStart(userId)}
                      onTouchStart={() => handleTouchStart(userId)}
                    >
                      {getUserName(userId)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider-arrow">⇄</div>

              <div
                className="group-box group-b"
                onDragOver={handleDragOver}
                onDrop={() => handleDropToGroup('B')}
                onTouchEnd={(e) => handleTouchEnd(e, 'B')}
              >
                <h4>그룹 B ({groupB.length}명)</h4>
                <div className="player-grid">
                  {groupB.map(userId => (
                    <div
                      key={userId}
                      className="player-card draggable"
                      draggable
                      onDragStart={() => handleDragStart(userId)}
                      onTouchStart={() => handleTouchStart(userId)}
                    >
                      {getUserName(userId)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEED 타입: 시드/일반 분할 */}
          {drawType === 'SEED' && (
            <div className="group-division">
              <div
                className="group-box seed-group"
                onDragOver={handleDragOver}
                onDrop={() => handleDropToSeedGroup('SEED')}
                onTouchEnd={(e) => handleTouchEnd(e, 'SEED')}
              >
                <h4>시드 플레이어 ({seedPlayers.length}명)</h4>
                <div className="player-grid">
                  {seedPlayers.map(userId => (
                    <div
                      key={userId}
                      className="player-card draggable seed"
                      draggable
                      onDragStart={() => handleDragStart(userId)}
                      onTouchStart={() => handleTouchStart(userId)}
                    >
                      ⭐ {getUserName(userId)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider-arrow">⇄</div>

              <div
                className="group-box normal-group"
                onDragOver={handleDragOver}
                onDrop={() => handleDropToSeedGroup('NORMAL')}
                onTouchEnd={(e) => handleTouchEnd(e, 'NORMAL')}
              >
                <h4>일반 플레이어 ({normalPlayers.length}명)</h4>
                <div className="player-grid">
                  {normalPlayers.map(userId => (
                    <div
                      key={userId}
                      className="player-card draggable"
                      draggable
                      onDragStart={() => handleDragStart(userId)}
                      onTouchStart={() => handleTouchStart(userId)}
                    >
                      {getUserName(userId)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 대기 참가자 (AB/SEED에서만 추가 가능) */}
          {(drawType === 'AB' || drawType === 'SEED') && waitingParticipants.length > 0 && (
            <div className="waiting-players-pool">
              <h4>대기 참가자 ({waitingParticipants.length}명) - 드래그하여 추가</h4>
              <div className="player-grid">
                {waitingParticipants
                  .filter(p => {
                    const isInAB = groupA.includes(p.userId) || groupB.includes(p.userId);
                    const isInSEED = seedPlayers.includes(p.userId) || normalPlayers.includes(p.userId);
                    return !isInAB && !isInSEED;
                  })
                  .map(p => (
                    <div
                      key={p.userId}
                      className="player-card draggable waiting"
                      draggable
                      onDragStart={() => handleDragStart(p.userId)}
                      onTouchStart={() => handleTouchStart(p.userId)}
                    >
                      {getUserName(p.userId)}
                    </div>
                  ))}
              </div>
            </div>
          )}

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
              disabled={loading || !isValid}
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
