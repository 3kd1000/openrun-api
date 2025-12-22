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
  onSuccess: () => void;
}

type DrawType = 'AA' | 'AB' | 'SEED';

const DrawCreateModal: React.FC<Props> = ({ scheduleId, participants, onClose, onSuccess }) => {
  const confirmedUserIds = participants.filter(p => p.status === 'CONFIRMED').map(p => p.userId);

  const [drawType, setDrawType] = useState<DrawType>('AA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AA 타입: 참가/대기
  const [confirmedGroup, setConfirmedGroup] = useState<number[]>([]);
  const [waitingGroup, setWaitingGroup] = useState<number[]>([]);

  // AB 타입: 그룹 A/B
  const [groupA, setGroupA] = useState<number[]>([]);
  const [groupB, setGroupB] = useState<number[]>([]);

  // SEED 타입: 시드/일반
  const [seedPlayers, setSeedPlayers] = useState<number[]>([]);
  const [normalPlayers, setNormalPlayers] = useState<number[]>([]);

  // 체크박스 선택 상태
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // 대진 생성 결과
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
    const allParticipantIds = participants.map(p => p.userId);
    const waitingIds = allParticipantIds.filter(id => !confirmedUserIds.includes(id));

    if (drawType === 'AA') {
      // AA: 참가 확정자는 confirmedGroup, 나머지는 waitingGroup
      setConfirmedGroup(confirmedUserIds);
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setSeedPlayers([]);
      setNormalPlayers([]);
    } else if (drawType === 'AB') {
      // AB: 반반 나누기 + 대기열
      setGroupA(confirmedUserIds.slice(0, half));
      setGroupB(confirmedUserIds.slice(half));
      setWaitingGroup(waitingIds);
      setSeedPlayers([]);
      setNormalPlayers([]);
      setConfirmedGroup([]);
    } else if (drawType === 'SEED') {
      // SEED: 시드 수에 맞춰 분할 + 대기열
      const seedCount = getSeedCount(totalCount);
      setSeedPlayers(confirmedUserIds.slice(0, seedCount));
      setNormalPlayers(confirmedUserIds.slice(seedCount));
      setWaitingGroup(waitingIds);
      setGroupA([]);
      setGroupB([]);
      setConfirmedGroup([]);
    }
  }, [drawType, participants]);

  // 체크박스 토글
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // AA: 선택된 사용자들을 참가/대기열로 이동
  const moveSelectedToAAGroup = (targetGroup: 'CONFIRMED' | 'WAITING') => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === 'CONFIRMED') {
      const newConfirmedGroup = [...confirmedGroup, ...selectedUsers.filter(id => !confirmedGroup.includes(id))];
      const newWaitingGroup = waitingGroup.filter(id => !selectedUsers.includes(id));
      setConfirmedGroup(newConfirmedGroup);
      setWaitingGroup(newWaitingGroup);
    } else {
      const newWaitingGroup = [...waitingGroup, ...selectedUsers.filter(id => !waitingGroup.includes(id))];
      const newConfirmedGroup = confirmedGroup.filter(id => !selectedUsers.includes(id));
      setWaitingGroup(newWaitingGroup);
      setConfirmedGroup(newConfirmedGroup);
    }
    setSelectedUsers([]);
  };

  // AB: 선택된 사용자들을 그룹으로 이동 (A, B, 대기열)
  const moveSelectedToABGroup = (targetGroup: 'A' | 'B' | 'WAITING') => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === 'A') {
      const newGroupA = [...groupA, ...selectedUsers.filter(id => !groupA.includes(id))];
      const newGroupB = groupB.filter(id => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(id => !selectedUsers.includes(id));
      setGroupA(newGroupA);
      setGroupB(newGroupB);
      setWaitingGroup(newWaitingGroup);
    } else if (targetGroup === 'B') {
      const newGroupB = [...groupB, ...selectedUsers.filter(id => !groupB.includes(id))];
      const newGroupA = groupA.filter(id => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(id => !selectedUsers.includes(id));
      setGroupA(newGroupA);
      setGroupB(newGroupB);
      setWaitingGroup(newWaitingGroup);
    } else {
      // WAITING
      const newWaitingGroup = [...waitingGroup, ...selectedUsers.filter(id => !waitingGroup.includes(id))];
      const newGroupA = groupA.filter(id => !selectedUsers.includes(id));
      const newGroupB = groupB.filter(id => !selectedUsers.includes(id));
      setWaitingGroup(newWaitingGroup);
      setGroupA(newGroupA);
      setGroupB(newGroupB);
    }
    setSelectedUsers([]);
  };

  // SEED: 선택된 사용자들을 시드/일반/대기열로 이동
  const moveSelectedToSeedGroup = (targetGroup: 'SEED' | 'NORMAL' | 'WAITING') => {
    if (selectedUsers.length === 0) return;

    if (targetGroup === 'SEED') {
      const newSeedPlayers = [...seedPlayers, ...selectedUsers.filter(id => !seedPlayers.includes(id))];
      const newNormalPlayers = normalPlayers.filter(id => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(id => !selectedUsers.includes(id));
      setSeedPlayers(newSeedPlayers);
      setNormalPlayers(newNormalPlayers);
      setWaitingGroup(newWaitingGroup);
    } else if (targetGroup === 'NORMAL') {
      const newNormalPlayers = [...normalPlayers, ...selectedUsers.filter(id => !normalPlayers.includes(id))];
      const newSeedPlayers = seedPlayers.filter(id => !selectedUsers.includes(id));
      const newWaitingGroup = waitingGroup.filter(id => !selectedUsers.includes(id));
      setNormalPlayers(newNormalPlayers);
      setSeedPlayers(newSeedPlayers);
      setWaitingGroup(newWaitingGroup);
    } else {
      // WAITING
      const newWaitingGroup = [...waitingGroup, ...selectedUsers.filter(id => !waitingGroup.includes(id))];
      const newSeedPlayers = seedPlayers.filter(id => !selectedUsers.includes(id));
      const newNormalPlayers = normalPlayers.filter(id => !selectedUsers.includes(id));
      setWaitingGroup(newWaitingGroup);
      setSeedPlayers(newSeedPlayers);
      setNormalPlayers(newNormalPlayers);
    }
    setSelectedUsers([]);
  };

  // 대진 생성 (또는 재생성)
  const handleCreateDraw = async () => {
    try {
      setLoading(true);
      setError('');

      let request: any = {
        drawType,
        numberOfTotalPlayer: drawType === 'AA' ? confirmedGroup.length : confirmedUserIds.length
      };

      if (drawType === 'AA') {
        request.userNames = confirmedGroup.map(id => getUserName(id));
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

      const result = await drawService.createDrawWithSchedule(scheduleId, request);
      setDrawResult(result);

    } catch (err: any) {
      console.error('대진 생성 실패:', err);
      setError(err.response?.data?.message || '대진 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 대진표 텍스트로 포맷팅
  const formatDrawAsText = (): string => {
    if (!drawResult) return '';
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

  // 현재 선택된 총 인원
  const totalSelected = drawType === 'AA'
    ? confirmedGroup.length
    : drawType === 'AB'
    ? groupA.length + groupB.length
    : seedPlayers.length + normalPlayers.length;

  // 유효성 검사
  const isValid = totalSelected >= 4 && totalSelected % 2 === 0 &&
    (drawType === 'AB' ? groupA.length > 0 && groupB.length > 0 && groupA.length === groupB.length : true) &&
    (drawType === 'SEED' ?
      seedPlayers.length > 0 &&
      normalPlayers.length > 0 &&
      seedPlayers.length === getSeedCount(totalSelected)
      : true);

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

          {/* AA 타입: 참가자/대기열 관리 */}
          {drawType === 'AA' && (
            <>
              {selectedUsers.length > 0 && (
                <div className="selected-count-badge">
                  {selectedUsers.length}명 선택됨
                </div>
              )}
              <div className="move-buttons">
                <button
                  type="button"
                  onClick={() => moveSelectedToAAGroup('CONFIRMED')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  참가로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToAAGroup('WAITING')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  대기열로 이동
                </button>
              </div>

              <div className="group-division">
                <div className="group-box confirmed-group">
                  <h4>참가 확정 ({confirmedGroup.length}명)</h4>
                  <div className="player-grid">
                    {confirmedGroup.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AB 타입: 그룹 A/B 분할 */}
          {drawType === 'AB' && (
            <>
              {selectedUsers.length > 0 && (
                <div className="selected-count-badge">
                  {selectedUsers.length}명 선택됨
                </div>
              )}
              <div className="move-buttons">
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup('A')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  A로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup('B')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  B로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToABGroup('WAITING')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group btn-move-waiting"
                >
                  대기로 이동
                </button>
              </div>

              <div className="group-division group-division-ab">
                <div className="group-box group-a">
                  <h4>그룹 A ({groupA.length}명)</h4>
                  <div className="player-grid">
                    {groupA.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box group-b">
                  <h4>그룹 B ({groupB.length}명)</h4>
                  <div className="player-grid">
                    {groupB.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group waiting-group-full">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SEED 타입: 시드/일반 분할 */}
          {drawType === 'SEED' && (
            <>
              {selectedUsers.length > 0 && (
                <div className="selected-count-badge">
                  {selectedUsers.length}명 선택됨
                </div>
              )}
              <div className="move-buttons">
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup('SEED')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  시드로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup('NORMAL')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group"
                >
                  일반으로 이동
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedToSeedGroup('WAITING')}
                  disabled={selectedUsers.length === 0}
                  className="btn-move-group btn-move-waiting"
                >
                  대기로 이동
                </button>
              </div>

              <div className="group-division group-division-seed">
                <div className="group-box seed-group">
                  <h4>
                    시드 플레이어 ({seedPlayers.length}/{getSeedCount(seedPlayers.length + normalPlayers.length)}명)
                  </h4>
                  <div className="player-grid">
                    {seedPlayers.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox seed ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>⭐ {getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box normal-group">
                  <h4>일반 플레이어 ({normalPlayers.length}명)</h4>
                  <div className="player-grid">
                    {normalPlayers.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group-box waiting-group waiting-group-full">
                  <h4>대기열 ({waitingGroup.length}명)</h4>
                  <div className="player-grid">
                    {waitingGroup.map(userId => (
                      <div
                        key={userId}
                        className={`player-card-with-checkbox waiting ${selectedUsers.includes(userId) ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => toggleUserSelection(userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{getUserName(userId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 대진 생성 결과 */}
          {drawResult && (
            <div className="draw-result-section">
              <h3>🎯 대진표 생성 완료</h3>
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
          )}

          {/* 액션 버튼 */}
          <div className="modal-actions">
            {!drawResult ? (
              <>
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
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-copy"
                >
                  {copied ? '✓ 복사됨' : '📋 복사'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateDraw}
                  className="btn-regenerate"
                  disabled={loading}
                >
                  🔄 재생성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="btn-primary"
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawCreateModal;
