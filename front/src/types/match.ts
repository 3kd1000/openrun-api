export interface Match {
  id: number;
  clubId: number;
  scheduleId?: number;
  drawId?: number;
  matchNumber: number;

  // Team A
  teamAPlayer1Id: number;
  teamAPlayer1Name: string;
  teamAPlayer2Id?: number;
  teamAPlayer2Name?: string;

  // Team B
  teamBPlayer1Id: number;
  teamBPlayer1Name: string;
  teamBPlayer2Id?: number;
  teamBPlayer2Name?: string;

  // 경기 결과
  teamAScore?: number;
  teamBScore?: number;
  result?: 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW';

  playedAt: string; // ISO 8601 format
  isMigrated: boolean;
}

export interface MatchPageResponse {
  content: Match[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}
