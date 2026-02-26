export interface Match {
  id: number;
  clubId: number;
  scheduleId?: number;
  drawId?: number;
  matchNumber: number;
  teamAPlayer1Id: number;
  teamAPlayer1Name: string;
  teamAPlayer2Id?: number;
  teamAPlayer2Name?: string;
  teamBPlayer1Id: number;
  teamBPlayer1Name: string;
  teamBPlayer2Id?: number;
  teamBPlayer2Name?: string;
  teamAScore?: number;
  teamBScore?: number;
  result?: "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW";
  playedAt: string;
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
