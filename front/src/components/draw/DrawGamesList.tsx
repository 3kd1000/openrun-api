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
import { cn } from "../../lib/utils";

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
  /** 컨테이너 className 오버라이드 */
  className?: string;
}

/**
 * DrawGamesList 컴포넌트
 * 대진표의 게임 목록을 라운드별로 그룹화하여 표시합니다.
 *
 * 색상: 프로젝트 CSS 변수 사용 (--color-bg-*, --color-text-*, --color-primary)
 * shadcn 색상(--secondary 등)은 테마 충돌로 사용하지 않음
 */
const DrawGamesList: React.FC<DrawGamesListProps> = ({
  games,
  playerCount,
  numberOfCourts,
  isEditMode = false,
  onScoreChange,
  matchScores,
  onResetResult,
  className,
}) => {
  // 라운드별로 그룹화 (인원수 기반으로 라운드당 게임 수 계산)
  const gamesByRound = groupGamesByRound(games, playerCount, numberOfCourts);
  const sortedRounds = getSortedRounds(gamesByRound);

  return (
    <div className={cn("flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-0", className)}>
      {sortedRounds.map((round) => (
        <div key={round} className="flex flex-col gap-1">
          <div className="flex items-center mb-1">
            <span className="text-base font-bold text-[var(--color-primary)] py-1 border-b-2 border-[var(--color-primary)] min-w-[80px] max-[768px]:text-sm max-[768px]:min-w-[70px]">
              라운드 {round}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {gamesByRound[round].map((game) => {
              const matchId = game.matchId;
              const scores = matchId ? matchScores?.get(matchId) : undefined;
              const hasExistingResult =
                isScoreSet(game.teamAScore) &&
                isScoreSet(game.teamBScore) &&
                (game.teamAScore !== 0 || game.teamBScore !== 0);

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
              const hasResult = isTeamAWinner || isTeamBWinner || isDraw;

              return (
                <div
                  key={game.gameNo}
                  className={cn(
                    "grid items-center gap-1 px-2 py-1 rounded border-l-[3px] border-l-transparent",
                    // 기본 배경: 프로젝트 CSS 변수 사용
                    hasResult ? "bg-[var(--color-bg-tertiary)]" : "bg-[var(--color-bg-secondary)]",
                    // 편집 모드: 3컬럼, 읽기 모드: 2컬럼
                    isEditMode ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[auto_1fr]",
                    // border-left 색상 (승리: 에메랄드, 무승부: 앰버)
                    (isTeamAWinner || isTeamBWinner) && "border-l-[var(--color-emerald)]",
                    isDraw && "border-l-amber-500",
                    // 반응형
                    "max-[768px]:px-1.5 max-[768px]:gap-0.5",
                  )}
                >
                  {/* 게임 번호 */}
                  <span className="text-sm font-bold text-[var(--color-text-secondary)] min-w-[35px] text-left max-[359px]:text-xs max-[359px]:min-w-[30px]">
                    게임{game.gameNo}
                  </span>

                  {/* 게임 내용: 팀A [스코어] : [스코어] 팀B */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0.5 min-w-0">
                    {/* 팀 A 섹션 */}
                    <div className="flex items-center gap-1 justify-end min-w-0">
                      <span
                        className={cn(
                          "text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                          "max-[768px]:text-sm max-[359px]:text-xs",
                          // 승리팀 하이라이트 (에메랄드)
                          isTeamAWinner && "bg-[var(--color-emerald-light)] text-[var(--color-emerald-dark)] font-bold rounded px-1.5 py-0.5",
                          isDraw && "bg-amber-100 text-amber-800 font-bold rounded px-1.5 py-0.5",
                          // 패배팀 (결과 없을 때와 동일)
                          isTeamBWinner && "text-[var(--color-text-primary)]",
                          // 결과 없을 때 기본
                          !hasResult && "text-[var(--color-text-primary)]",
                        )}
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
                              className="w-7 px-1 py-0.5 text-center text-base font-bold border border-[var(--color-text-primary)] rounded bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] outline-none max-[768px]:w-6 max-[768px]:text-sm max-[359px]:w-5 max-[359px]:text-xs"
                              value={displayTeamAScore}
                              onChange={(e) =>
                                onScoreChange?.(matchId, "A", e.target.value)
                              }
                              placeholder="0"
                            />
                          ) : hasExistingResult ? (
                            <span className="text-base font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded px-1 py-0.5 min-w-[20px] text-center max-[768px]:text-sm max-[359px]:text-xs">
                              {displayTeamAScore}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* 구분자 */}
                    <span className="text-[var(--color-text-tertiary)] font-bold px-0.5 shrink-0">:</span>

                    {/* 팀 B 섹션 */}
                    <div className="flex items-center gap-1 justify-start min-w-0">
                      {matchId && (
                        <>
                          {isEditMode ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              max="7"
                              className="w-7 px-1 py-0.5 text-center text-base font-bold border border-[var(--color-text-primary)] rounded bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] outline-none max-[768px]:w-6 max-[768px]:text-sm max-[359px]:w-5 max-[359px]:text-xs"
                              value={displayTeamBScore}
                              onChange={(e) =>
                                onScoreChange?.(matchId, "B", e.target.value)
                              }
                              placeholder="0"
                            />
                          ) : hasExistingResult ? (
                            <span className="text-base font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded px-1 py-0.5 min-w-[20px] text-center max-[768px]:text-sm max-[359px]:text-xs">
                              {displayTeamBScore}
                            </span>
                          ) : null}
                        </>
                      )}
                      <span
                        className={cn(
                          "text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                          "max-[768px]:text-sm max-[359px]:text-xs",
                          // 승리팀 하이라이트 (에메랄드)
                          isTeamBWinner && "bg-[var(--color-emerald-light)] text-[var(--color-emerald-dark)] font-bold rounded px-1.5 py-0.5",
                          isDraw && "bg-amber-100 text-amber-800 font-bold rounded px-1.5 py-0.5",
                          // 패배팀
                          isTeamAWinner && "text-[var(--color-text-primary)]",
                          // 결과 없을 때 기본
                          !hasResult && "text-[var(--color-text-primary)]",
                        )}
                      >
                        {teamBNames}
                      </span>
                    </div>
                  </div>

                  {/* 편집 모드: 리셋 버튼 */}
                  {isEditMode && (
                    <div className="min-w-[28px] flex justify-end items-center">
                      {matchId && onResetResult ? (
                        <button
                          type="button"
                          className={cn(
                            "p-1 bg-transparent border-none rounded cursor-pointer inline-flex items-center justify-center transition-colors",
                            "text-[var(--color-text-tertiary)]",
                            "hover:text-red-600 hover:bg-red-50",
                            "active:scale-95",
                            "disabled:cursor-default",
                            !(hasExistingResult && isNotEmpty(game.result)) && "invisible pointer-events-none"
                          )}
                          onClick={() => onResetResult(matchId)}
                          title="결과 삭제"
                          disabled={!hasExistingResult || !isNotEmpty(game.result)}
                        >
                          <Trash2Icon size={14} />
                        </button>
                      ) : null}
                    </div>
                  )}
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
