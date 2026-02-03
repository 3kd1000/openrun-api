/**
 * DrawGamesList.tsx
 * 대진표 게임 리스트 컴포넌트
 *
 * DrawCreateModal과 DrawViewModal에서 공통으로 사용하는
 * 게임 리스트 렌더링 로직을 분리한 재사용 가능한 컴포넌트
 */

import React from "react";
import type { DrawGame } from "../../services/drawService";
import {
  groupGamesByRound,
  getSortedRounds,
} from "../../utils/DrawFormatUtils";
import { isNotEmpty, isScoreSet } from "../../utils/isEmpty";
import { Trash2Icon } from "../common/Icons";

export interface DrawGamesListProps {
  /** 대진표 게임 목록 */
  games: DrawGame[];
  /** 참가 인원수 (라운드당 게임 수 계산용) */
  playerCount?: number;
  /** 코트 수 (지정 시 해당 값 우선 적용) */
  numberOfCourts?: number | null;
  /** 편집 모드 활성화 여부 (DrawViewModal에서 결과 입력 시 사용) */
  isEditMode?: boolean;
  /** 스코어 변경 핸들러 (편집 모드에서 사용) */
  onScoreChange?: (matchId: number, team: "A" | "B", value: string) => void;
  /** 매치별 스코어 임시 저장 Map (편집 모드에서 사용) */
  matchScores?: Map<number, { teamAScore: string; teamBScore: string }>;
  /** 결과 초기화 핸들러 (편집 모드에서 사용) */
  onResetResult?: (matchId: number) => void;
}

/**
 * DrawGamesList 컴포넌트
 * 대진표의 게임 목록을 라운드별로 그룹화하여 표시합니다.
 */
const DrawGamesList: React.FC<DrawGamesListProps> = ({
  games,
  playerCount,
  numberOfCourts,
  isEditMode = false,
  onScoreChange,
  matchScores,
  onResetResult,
}) => {
  // 라운드별로 그룹화 (인원수 기반으로 라운드당 게임 수 계산)
  const gamesByRound = groupGamesByRound(games, playerCount, numberOfCourts);
  const sortedRounds = getSortedRounds(gamesByRound);

  return (
    <div className="dgc-games-list">
      {sortedRounds.map((round) => (
        <div key={round} className="dgc-round-group">
          <div className="dgc-round-header">
            <span className="dgc-round-indicator">라운드 {round}</span>
          </div>
          <div className="dgc-round-games">
            {gamesByRound[round].map((game) => {
              const matchId = game.matchId;
              const scores = matchId ? matchScores?.get(matchId) : undefined;
              // 두 팀 모두 점수가 설정되었고, 한 팀이라도 0이 아니면 결과가 있는 것
              // 0-0인 경우는 경기가 진행되지 않은 것으로 간주
              const hasExistingResult =
                isScoreSet(game.teamAScore) &&
                isScoreSet(game.teamBScore) &&
                (game.teamAScore !== 0 || game.teamBScore !== 0);

              // 표시할 스코어 (입력 중이면 입력값, 아니면 기존값)
              // 0점도 유효한 점수이므로 isScoreSet 사용
              const displayTeamAScore =
                isEditMode && scores?.teamAScore !== undefined
                  ? scores.teamAScore
                  : isScoreSet(game.teamAScore) && game.teamAScore !== undefined
                  ? game.teamAScore.toString()
                  : "";
              const displayTeamBScore =
                isEditMode && scores?.teamBScore !== undefined
                  ? scores.teamBScore
                  : isScoreSet(game.teamBScore) && game.teamBScore !== undefined
                  ? game.teamBScore.toString()
                  : "";

              const teamANames = game.teamA.join(", ");
              const teamBNames = game.teamB.join(", ");

              const isTeamAWinner = !isEditMode && game.result === "TEAM_A_WIN";
              const isTeamBWinner = !isEditMode && game.result === "TEAM_B_WIN";
              const isDraw = !isEditMode && game.result === "DRAW";

              // 게임 행 클래스 이름
              const gameRowClasses = [
                "dgc-game-row",
                hasExistingResult ? "dgc-game-row--has-result" : "",
                isTeamAWinner ? "dgc-game-row--team-a-winner" : "",
                isTeamBWinner ? "dgc-game-row--team-b-winner" : "",
                isDraw ? "dgc-game-row--draw" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={game.gameNo} className={gameRowClasses}>
                  <span className="dgc-game-number">게임{game.gameNo}</span>
                  <div className="dgc-game-content">
                    {/* 팀 A 섹션 */}
                    <div className="dgc-team-a-section">
                      <span
                        className={`dgc-team-a-names ${
                          isTeamAWinner ? "dgc-team-a-names--winner" : ""
                        }`}
                      >
                        {teamANames}
                      </span>
                      {matchId && (
                        <>
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              max="7"
                              className="dgc-score-input"
                              value={displayTeamAScore}
                              onChange={(e) =>
                                onScoreChange?.(matchId, "A", e.target.value)
                              }
                              placeholder="0"
                            />
                          ) : hasExistingResult ? (
                            <span className="dgc-score-display">
                              {displayTeamAScore}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* 구분자 */}
                    <span className="dgc-game-separator">:</span>

                    {/* 팀 B 섹션 */}
                    <div className="dgc-team-b-section">
                      {matchId && (
                        <>
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              max="7"
                              className="dgc-score-input"
                              value={displayTeamBScore}
                              onChange={(e) =>
                                onScoreChange?.(matchId, "B", e.target.value)
                              }
                              placeholder="0"
                            />
                          ) : hasExistingResult ? (
                            <span className="dgc-score-display">
                              {displayTeamBScore}
                            </span>
                          ) : null}
                        </>
                      )}
                      <span
                        className={`dgc-team-b-names ${
                          isTeamBWinner ? "dgc-team-b-names--winner" : ""
                        }`}
                      >
                        {teamBNames}
                      </span>
                    </div>
                  </div>
                  {/* 오른쪽 끝 영역: 결과 배지 또는 삭제 버튼 */}
                  <div className="dgc-end-section">
                    {isEditMode && matchId && onResetResult ? (
                      <button
                        type="button"
                        className={`dgc-reset-button ${
                          hasExistingResult && isNotEmpty(game.result)
                            ? ""
                            : "dgc-reset-button--hidden"
                        }`}
                        onClick={() => onResetResult(matchId)}
                        title="결과 삭제"
                        disabled={!hasExistingResult || !isNotEmpty(game.result)}
                      >
                        <Trash2Icon size={14} />
                      </button>
                    ) : hasExistingResult && isNotEmpty(game.result) ? (
                      <span
                        className={`dgc-result-badge dgc-result-badge--${
                          game.result === "TEAM_A_WIN"
                            ? "team-a-win"
                            : game.result === "TEAM_B_WIN"
                            ? "team-b-win"
                            : "draw"
                        }`}
                      >
                        {game.result === "TEAM_A_WIN"
                          ? "A 승"
                          : game.result === "TEAM_B_WIN"
                          ? "B 승"
                          : "무"}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DrawGamesList;
