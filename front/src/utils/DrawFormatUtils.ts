/**
 * DrawFormatUtils.ts
 * 대진표 포맷팅 관련 유틸리티 함수
 *
 * DrawCreateModal과 DrawViewModal에서 공통으로 사용하는 로직을 분리
 */

import type { DrawResponse, DrawGame } from "../services/drawService";

/**
 * 인원수에 따른 라운드당 게임 수 계산
 * - 4~7명: 1코트 → 1게임/라운드
 * - 8~11명: 2코트 → 2게임/라운드
 * - 12~15명: 3코트 → 3게임/라운드
 * - 16명: 4코트 → 4게임/라운드
 * @param playerCount - 참가 인원수
 * @returns 라운드당 게임 수
 */
export function getGamesPerRound(playerCount: number): number {
  if (playerCount <= 7) return 1;
  if (playerCount <= 11) return 2;
  if (playerCount <= 15) return 3;
  return 4; // 16명
}

/**
 * 게임 수로부터 참가 인원수를 추정
 * AA 방식 기준: n명 → n*(n-1)/2 게임
 * 역산: games = n*(n-1)/2 → n = (1 + sqrt(1 + 8*games)) / 2
 * @param totalGames - 총 게임 수
 * @returns 추정 인원수
 */
export function estimatePlayerCount(totalGames: number): number {
  // n*(n-1)/2 = games → n^2 - n - 2*games = 0
  // n = (1 + sqrt(1 + 8*games)) / 2
  const n = (1 + Math.sqrt(1 + 8 * totalGames)) / 2;
  return Math.round(n);
}

/**
 * 게임을 라운드별로 그룹화
 * 인원수에 따라 라운드당 게임 수가 달라짐
 * @param games - 대진표의 게임 목록
 * @param playerCount - 참가 인원수 (없으면 게임 수로 추정)
 * @returns 라운드 번호를 키로 하는 게임 그룹
 */
export function groupGamesByRound(
  games: DrawGame[],
  playerCount?: number
): { [round: number]: DrawGame[] } {
  const gamesByRound: { [round: number]: DrawGame[] } = {};

  // 인원수가 주어지지 않으면 게임 수로 추정
  const effectivePlayerCount = playerCount ?? estimatePlayerCount(games.length);
  const gamesPerRound = getGamesPerRound(effectivePlayerCount);

  // gameNo 기준으로 정렬 후 라운드 재계산
  const sortedGames = [...games].sort((a, b) => a.gameNo - b.gameNo);

  sortedGames.forEach((game, index) => {
    // 라운드 번호 재계산: (index / gamesPerRound) + 1
    const calculatedRound = Math.floor(index / gamesPerRound) + 1;

    if (!gamesByRound[calculatedRound]) {
      gamesByRound[calculatedRound] = [];
    }
    gamesByRound[calculatedRound].push(game);
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
    playerCount?: number; // 참가 인원수 (라운드 계산용)
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

  // 라운드별로 그룹화 (인원수 기반으로 라운드당 게임 수 계산)
  const gamesByRound = groupGamesByRound(drawResult.games, options?.playerCount);
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
