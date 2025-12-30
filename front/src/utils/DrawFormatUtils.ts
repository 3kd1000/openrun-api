/**
 * DrawFormatUtils.ts
 * 대진표 포맷팅 관련 유틸리티 함수
 *
 * DrawCreateModal과 DrawViewModal에서 공통으로 사용하는 로직을 분리
 */

import type { DrawResponse, DrawGame } from "../services/drawService";

/**
 * 게임을 라운드별로 그룹화
 * @param games - 대진표의 게임 목록
 * @returns 라운드 번호를 키로 하는 게임 그룹
 */
export function groupGamesByRound(
  games: DrawGame[]
): { [round: number]: DrawGame[] } {
  const gamesByRound: { [round: number]: DrawGame[] } = {};

  games.forEach((game) => {
    if (!gamesByRound[game.roundNo]) {
      gamesByRound[game.roundNo] = [];
    }
    gamesByRound[game.roundNo].push(game);
  });

  return gamesByRound;
}

/**
 * 라운드 번호를 오름차순으로 정렬하여 반환
 * @param gamesByRound - 라운드별로 그룹화된 게임 객체
 * @returns 정렬된 라운드 번호 배열
 */
export function getSortedRounds(gamesByRound: {
  [round: number]: DrawGame[];
}): number[] {
  return Object.keys(gamesByRound)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * 대진표를 텍스트로 포맷팅 (클립보드 복사용)
 * @param drawResult - 대진표 데이터
 * @param options - 포맷팅 옵션
 * @returns 포맷팅된 텍스트
 */
export function formatDrawAsText(
  drawResult: DrawResponse | null,
  options?: {
    title?: string; // 제목 (예: "🎯 대진표")
    courtName?: string; // 코트 이름
    scheduledAt?: string; // 일정 시간
    drawType?: string; // 대진 타입
  }
): string {
  if (!drawResult) return "";

  let text = "";

  // 제목
  if (options?.title) {
    text += `${options.title}\n`;
  }

  // 일정 정보 (있는 경우)
  if (options?.courtName) {
    text += `📍 ${options.courtName}\n`;
  }
  if (options?.scheduledAt) {
    text += `📅 ${new Date(options.scheduledAt).toLocaleString("ko-KR")}\n`;
  }
  if (options?.drawType) {
    text += `대진 타입: ${options.drawType}\n`;
  }
  if (options?.courtName || options?.scheduledAt || options?.drawType) {
    text += "\n";
  }

  // 라운드별로 그룹화
  const gamesByRound = groupGamesByRound(drawResult.games);
  const sortedRounds = getSortedRounds(gamesByRound);

  // 각 라운드별로 텍스트 생성
  sortedRounds.forEach((round) => {
    text += `라운드 ${round}\n`;
    gamesByRound[round].forEach((game) => {
      const teamANames = game.teamA.join(", ");
      const teamBNames = game.teamB.join(", ");

      // 스코어가 있으면 포함, 없으면 팀 이름만
      if (
        game.teamAScore !== null &&
        game.teamAScore !== undefined &&
        game.teamBScore !== null &&
        game.teamBScore !== undefined
      ) {
        text += `게임${game.gameNo} ${teamANames} ${game.teamAScore} : ${game.teamBScore} ${teamBNames}\n`;
      } else {
        text += `게임${game.gameNo} ${teamANames} : ${teamBNames}\n`;
      }
    });
    text += "\n";
  });

  return text;
}
