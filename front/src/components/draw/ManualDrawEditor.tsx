/**
 * ManualDrawEditor.tsx
 * 수동 대진 편집 컴포넌트
 *
 * 두 가지 모드 지원:
 * 1. 생성 모드: initialGames 없음 → 빈 Game 슬롯으로 시작
 * 2. 수정 모드: initialGames 있음 → 기존 대진 데이터로 초기화
 *
 * 주요 기능:
 * - Round/Game 구조를 인원수 기반으로 자동 생성
 * - Game 편집: "편집" 클릭 → 참가자 pill 4개 선택 → Player 1,2,3,4 순서 배정
 * - Round 내 동일 선수 중복 배정 방지
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Participant } from "../../types/schedule";
import type { DrawGame, ManualGame } from "../../services/drawService";
import "./ManualDrawEditor.css";

interface ManualDrawEditorProps {
  /** 참가자 목록 */
  participants: Participant[];
  /** 총 플레이어 수 */
  playerCount: number;
  /** 코트 수 (지정 시 해당 값 우선 적용) */
  numberOfCourts?: number | null;
  /** 수정 모드: 기존 대진 데이터 (없으면 생성 모드) */
  initialGames?: DrawGame[];
  /** 완료 콜백 */
  onComplete: (games: ManualGame[]) => void;
  /** 취소 콜백 (수정 모드에서 사용) */
  onCancel?: () => void;
}

/** 내부 Game 상태 (편집용) */
interface EditableGame {
  gameNo: number;
  roundNo: number;
  teamAUserIds: (number | null)[];  // [player1, player2] or [null, null]
  teamBUserIds: (number | null)[];  // [player3, player4] or [null, null]
}

/**
 * 인원수 기반 라운드당 게임 수 계산
 * | 인원 | 라운드당 게임 |
 * |-----|-------------|
 * | 4~7명 | 1 게임 |
 * | 8~11명 | 2 게임 |
 * | 12~15명 | 3 게임 |
 * | 16명 | 4 게임 |
 */
const getGamesPerRound = (playerCount: number, numberOfCourts?: number | null): number => {
  const maxByPlayers = Math.floor(playerCount / 4) || 1;
  if (numberOfCourts != null && numberOfCourts >= 1) {
    return Math.min(maxByPlayers, numberOfCourts);
  }
  return maxByPlayers;
};

/**
 * 라운드 수 계산 (인원수 기반)
 * 각 게임에 4명씩 배정되므로, 라운드당 필요 인원 = gamesPerRound * 4
 * 총 라운드 = ceil(모든 조합 / 라운드당 게임)
 * 단순화: 4~16명 기준으로 고정된 라운드 수 사용
 */
const getRoundCount = (playerCount: number): number => {
  // 테니스 복식 대진표는 보통 3~5 라운드
  // 인원수별 적정 라운드:
  if (playerCount <= 5) return 3;
  if (playerCount <= 7) return 4;
  if (playerCount <= 9) return 4;
  if (playerCount <= 11) return 5;
  if (playerCount <= 13) return 5;
  return 5;
};

/**
 * 초기 빈 Game 구조 생성
 */
const createEmptyGames = (playerCount: number, numberOfCourts?: number | null): EditableGame[] => {
  const gamesPerRound = getGamesPerRound(playerCount, numberOfCourts);
  const roundCount = getRoundCount(playerCount);
  const games: EditableGame[] = [];
  let gameNo = 1;

  for (let roundNo = 1; roundNo <= roundCount; roundNo++) {
    for (let i = 0; i < gamesPerRound; i++) {
      games.push({
        gameNo: gameNo++,
        roundNo,
        teamAUserIds: [null, null],
        teamBUserIds: [null, null],
      });
    }
  }

  return games;
};

/**
 * 기존 DrawGame을 EditableGame으로 변환
 * userName → userId 매핑 필요
 */
const convertToEditableGames = (
  drawGames: DrawGame[],
  participants: Participant[]
): EditableGame[] => {
  const nameToId = new Map(participants.map((p) => [p.userName, p.userId]));

  return drawGames.map((g) => ({
    gameNo: g.gameNo,
    roundNo: g.roundNo,
    teamAUserIds: g.teamA.map((name) => nameToId.get(name) ?? null),
    teamBUserIds: g.teamB.map((name) => nameToId.get(name) ?? null),
  }));
};

/**
 * EditableGame을 ManualGame으로 변환 (API 요청용)
 */
const convertToManualGames = (games: EditableGame[]): ManualGame[] => {
  return games.map((g) => ({
    gameNo: g.gameNo,
    roundNo: g.roundNo,
    teamAUserIds: g.teamAUserIds.filter((id): id is number => id !== null),
    teamBUserIds: g.teamBUserIds.filter((id): id is number => id !== null),
  }));
};

const ManualDrawEditor: React.FC<ManualDrawEditorProps> = ({
  participants,
  playerCount,
  numberOfCourts,
  initialGames,
  onComplete,
  onCancel,
}) => {
  // 참가 확정자만 대진 편집 대상
  const confirmedParticipants = useMemo(
    () => participants.filter((p) => p.status === "CONFIRMED"),
    [participants]
  );

  // userId → userName 매핑
  const userIdToName = useMemo(
    () => new Map(confirmedParticipants.map((p) => [p.userId, p.userName])),
    [confirmedParticipants]
  );

  // 내부 Game 상태
  const [games, setGames] = useState<EditableGame[]>([]);

  // 현재 편집 중인 Game 번호 (null이면 편집 모드 아님)
  const [editingGameNo, setEditingGameNo] = useState<number | null>(null);

  // 편집 중인 Game에서 선택된 플레이어 순서 [player1, player2, player3, player4]
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  // 초기화
  useEffect(() => {
    if (initialGames && initialGames.length > 0) {
      // 수정 모드: 인원수 기반으로 빈 슬롯 생성 후 기존 데이터 순서대로 채워넣기
      const emptyGames = createEmptyGames(playerCount, numberOfCourts);
      const existingGames = convertToEditableGames(initialGames, participants);

      const mergedGames = emptyGames.map((emptyGame, index) => {
        if (index < existingGames.length) {
          return {
            ...emptyGame,
            teamAUserIds: existingGames[index].teamAUserIds,
            teamBUserIds: existingGames[index].teamBUserIds,
          };
        }
        return emptyGame;
      });

      setGames(mergedGames);
    } else {
      // 생성 모드: 빈 구조 생성
      setGames(createEmptyGames(playerCount, numberOfCourts));
    }
  }, [initialGames, participants, playerCount, numberOfCourts]);

  // 라운드별로 그룹화
  const gamesByRound = useMemo(() => {
    const grouped: Record<number, EditableGame[]> = {};
    games.forEach((game) => {
      if (!grouped[game.roundNo]) {
        grouped[game.roundNo] = [];
      }
      grouped[game.roundNo].push(game);
    });
    return grouped;
  }, [games]);

  const sortedRounds = useMemo(
    () => Object.keys(gamesByRound).map(Number).sort((a, b) => a - b),
    [gamesByRound]
  );

  // 특정 라운드에서 이미 배정된 선수 ID 목록
  const getAssignedPlayerIdsInRound = useCallback(
    (roundNo: number, excludeGameNo?: number): Set<number> => {
      const assigned = new Set<number>();
      games
        .filter((g) => g.roundNo === roundNo && g.gameNo !== excludeGameNo)
        .forEach((g) => {
          g.teamAUserIds.forEach((id) => id !== null && assigned.add(id));
          g.teamBUserIds.forEach((id) => id !== null && assigned.add(id));
        });
      return assigned;
    },
    [games]
  );

  // Game 완성 여부 확인 (4명 모두 배정됨)
  const isGameComplete = (game: EditableGame): boolean => {
    return (
      game.teamAUserIds.every((id) => id !== null) &&
      game.teamBUserIds.every((id) => id !== null)
    );
  };

  // 특정 라운드가 완전한지 확인 (라운드 내 모든 게임 완성)
  const isRoundComplete = useCallback(
    (roundNo: number): boolean => {
      const roundGames = gamesByRound[roundNo] || [];
      return roundGames.length > 0 && roundGames.every(isGameComplete);
    },
    [gamesByRound]
  );

  // 완성된 라운드 목록
  const completedRounds = useMemo(
    () => sortedRounds.filter(isRoundComplete),
    [sortedRounds, isRoundComplete]
  );

  // 저장 가능 여부: 최소 1개 라운드가 완성됨
  const canSave = completedRounds.length > 0;

  // Game 편집 시작
  const handleEditGame = (gameNo: number) => {
    const game = games.find((g) => g.gameNo === gameNo);
    if (!game) return;

    setEditingGameNo(gameNo);
    // 기존에 배정된 선수들을 selectedPlayers로 초기화
    const existing = [
      ...game.teamAUserIds.filter((id): id is number => id !== null),
      ...game.teamBUserIds.filter((id): id is number => id !== null),
    ];
    setSelectedPlayers(existing);
  };

  // 플레이어 pill 클릭 (편집 중인 Game에 선수 추가/제거)
  const handlePlayerClick = (userId: number) => {
    if (editingGameNo === null) return;

    setSelectedPlayers((prev) => {
      if (prev.includes(userId)) {
        // 이미 선택됨 → 제거
        return prev.filter((id) => id !== userId);
      } else if (prev.length < 4) {
        // 4명 미만이면 추가
        return [...prev, userId];
      }
      return prev;
    });
  };

  // Game 편집 확정
  const handleConfirmEdit = () => {
    if (editingGameNo === null || selectedPlayers.length !== 4) return;

    setGames((prev) =>
      prev.map((g) => {
        if (g.gameNo === editingGameNo) {
          return {
            ...g,
            teamAUserIds: [selectedPlayers[0], selectedPlayers[1]],
            teamBUserIds: [selectedPlayers[2], selectedPlayers[3]],
          };
        }
        return g;
      })
    );

    setEditingGameNo(null);
    setSelectedPlayers([]);
  };

  // Game 편집 취소
  const handleCancelEdit = () => {
    setEditingGameNo(null);
    setSelectedPlayers([]);
  };

  // Game 초기화 (비우기)
  const handleClearGame = (gameNo: number) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.gameNo === gameNo) {
          return {
            ...g,
            teamAUserIds: [null, null],
            teamBUserIds: [null, null],
          };
        }
        return g;
      })
    );
  };

  // 대진 저장 - 완성된 라운드의 게임만 전송
  const handleSave = () => {
    if (!canSave) return;
    // 완성된 라운드의 게임만 필터링
    const completeGames = games.filter(
      (g) => completedRounds.includes(g.roundNo) && isGameComplete(g)
    );
    onComplete(convertToManualGames(completeGames));
  };

  // 현재 편집 중인 Game
  const editingGame = games.find((g) => g.gameNo === editingGameNo);

  // 현재 편집 중인 라운드에서 이미 배정된 선수들 (현재 Game 제외)
  const assignedInCurrentRound = useMemo(() => {
    if (!editingGame) return new Set<number>();
    return getAssignedPlayerIdsInRound(editingGame.roundNo, editingGameNo ?? undefined);
  }, [editingGame, editingGameNo, getAssignedPlayerIdsInRound]);

  return (
    <div className="mde">
      {/* 편집 모드가 아닐 때: Round/Game 구조 표시 */}
      {editingGameNo === null && (
        <>
          <div className="mde__rounds">
            {sortedRounds.map((roundNo) => (
              <div key={roundNo} className="mde__round">
                <div className="mde__round-header">
                  <span className="mde__round-label">라운드 {roundNo}</span>
                </div>
                <div className="mde__games-grid">
                  {gamesByRound[roundNo].map((game) => {
                    const complete = isGameComplete(game);
                    return (
                      <div
                        key={game.gameNo}
                        className={`mde__game-slot ${
                          complete ? "mde__game-slot--complete" : "mde__game-slot--empty"
                        }`}
                      >
                        <div className="mde__game-header">
                          <span className="mde__game-number">게임 {game.gameNo}</span>
                          <div className="mde__game-actions">
                            <button
                              type="button"
                              className="mde__btn-edit"
                              onClick={() => handleEditGame(game.gameNo)}
                            >
                              편집
                            </button>
                            {complete && (
                              <button
                                type="button"
                                className="mde__btn-clear"
                                onClick={() => handleClearGame(game.gameNo)}
                              >
                                초기화
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mde__game-teams">
                          {complete ? (
                            <>
                              <div className="mde__team mde__team--a">
                                <span className="mde__team-label">A</span>
                                <span className="mde__team-players">
                                  {game.teamAUserIds
                                    .map((id) => (id ? userIdToName.get(id) : "?"))
                                    .join(", ")}
                                </span>
                              </div>
                              <div className="mde__vs">vs</div>
                              <div className="mde__team mde__team--b">
                                <span className="mde__team-label">B</span>
                                <span className="mde__team-players">
                                  {game.teamBUserIds
                                    .map((id) => (id ? userIdToName.get(id) : "?"))
                                    .join(", ")}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="mde__empty-message">
                              편집 버튼을 눌러 선수 4명을 배정하세요
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 저장/취소 버튼 */}
          <div className="mde__footer">
            {onCancel && (
              <button type="button" className="mde__btn-cancel" onClick={onCancel}>
                취소
              </button>
            )}
            <button
              type="button"
              className="mde__btn-save"
              onClick={handleSave}
              disabled={!canSave}
            >
              대진 저장 (라운드 {completedRounds.length}/{sortedRounds.length})
            </button>
          </div>
        </>
      )}

      {/* 편집 모드: 참가자 pill 선택 UI */}
      {editingGameNo !== null && editingGame && (
        <div className="mde__editor">
          <div className="mde__editor-header">
            <h4>게임 {editingGameNo} 편집</h4>
            <span className="mde__editor-hint">
              라운드 {editingGame.roundNo} - 선수 4명을 순서대로 선택하세요
            </span>
          </div>

          {/* 선택된 선수 미리보기 */}
          <div className="mde__preview">
            <div className="mde__preview-team">
              <span className="mde__preview-label">Team A:</span>
              <span className="mde__preview-slot">
                {selectedPlayers[0] ? userIdToName.get(selectedPlayers[0]) : "P1"}
              </span>
              <span className="mde__preview-slot">
                {selectedPlayers[1] ? userIdToName.get(selectedPlayers[1]) : "P2"}
              </span>
            </div>
            <div className="mde__preview-vs">vs</div>
            <div className="mde__preview-team">
              <span className="mde__preview-label">Team B:</span>
              <span className="mde__preview-slot">
                {selectedPlayers[2] ? userIdToName.get(selectedPlayers[2]) : "P3"}
              </span>
              <span className="mde__preview-slot">
                {selectedPlayers[3] ? userIdToName.get(selectedPlayers[3]) : "P4"}
              </span>
            </div>
          </div>

          {/* 참가자 pill 그리드 */}
          <div className="mde__player-pills">
            {confirmedParticipants.map((p) => {
              const isAssignedInRound = assignedInCurrentRound.has(p.userId);
              const selectedIndex = selectedPlayers.indexOf(p.userId);
              const isSelected = selectedIndex !== -1;

              return (
                <button
                  key={p.userId}
                  type="button"
                  className={`mde__pill ${
                    isAssignedInRound
                      ? "mde__pill--disabled"
                      : isSelected
                      ? `mde__pill--selected mde__pill--order-${selectedIndex + 1}`
                      : ""
                  }`}
                  onClick={() => handlePlayerClick(p.userId)}
                  disabled={isAssignedInRound}
                >
                  {isSelected && (
                    <span className="mde__pill-order">{selectedIndex + 1}</span>
                  )}
                  <span className="mde__pill-name">{p.userName}</span>
                </button>
              );
            })}
          </div>

          {/* 편집 확인/취소 버튼 */}
          <div className="mde__editor-actions">
            <button
              type="button"
              className="mde__btn-cancel"
              onClick={handleCancelEdit}
            >
              취소
            </button>
            <button
              type="button"
              className="mde__btn-confirm"
              onClick={handleConfirmEdit}
              disabled={selectedPlayers.length !== 4}
            >
              확인 ({selectedPlayers.length}/4)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualDrawEditor;
