import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import type { Match } from "../../types/match";
import { format } from "date-fns";
import "./ScoreboardPage.css";

interface RankingEntry {
  rank: number;
  userId: number;
  userName: string;
  totalMatches: number;
  points: number;
  winRate: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  totalPointsScored: number;
  totalPointsConceded: number;
}

interface ScoreboardResponse {
  rankings: RankingEntry[];
}

type TabType = "ranking" | "matches";

const ScoreboardPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("ranking");

  // Tab 1: Rankings
  const START_YEAR = 2026; // 시작 연도 (하드코딩)
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    // 현재 연도가 시작 연도 이상이면 현재 연도, 아니면 시작 연도
    return currentYear >= START_YEAR ? currentYear : START_YEAR;
  });
  const [sortBy, setSortBy] = useState<"points" | "totalMatches" | "winRate">(
    "points"
  );

  // Tab 2: Match search
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "3months" | "6months" | "1year"
  >("all");
  const todayMatchRef = useRef<HTMLDivElement>(null);
  const isLoadingMatchesRef = useRef(false);

  const clubId = 1; // TODO: Context나 URL param에서 가져오기
  const isLoadingRef = useRef(false);

  // Tab 1: Fetch rankings
  const fetchScoreboard = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      // 연도 선택에 따라 기간 설정
      // 해당 연도의 1월 1일 00:00:00 ~ 12월 31일 23:59:59
      const startDate = new Date(selectedYear, 0, 1, 0, 0, 0).toISOString();
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

      const params = {
        startDate,
        endDate,
        sortBy,
      };

      const response = await axiosInstance.get<ScoreboardResponse>(
        `/clubs/${clubId}/scoreboard`,
        { params }
      );
      setRankings(response.data.rankings);
    } catch (err) {
      console.error("Failed to fetch scoreboard:", err);
      setError("스코어보드를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [clubId, selectedYear, sortBy]);

  // Tab 2: Fetch matches
  const fetchMatches = useCallback(
    async (searchPlayerName?: string) => {
      if (isLoadingMatchesRef.current) return;

      isLoadingMatchesRef.current = true;
      try {
        setMatchesLoading(true);
        setMatchesError(null);

        // 기간 계산
        let startDate: string | undefined;
        const endDate = new Date().toISOString();

        if (dateRange === "3months") {
          const date = new Date();
          date.setMonth(date.getMonth() - 3);
          startDate = date.toISOString();
        } else if (dateRange === "6months") {
          const date = new Date();
          date.setMonth(date.getMonth() - 6);
          startDate = date.toISOString();
        } else if (dateRange === "1year") {
          const date = new Date();
          date.setFullYear(date.getFullYear() - 1);
          startDate = date.toISOString();
        }

        // API 호출
        const params: {
          playerName?: string;
          startDate?: string;
          endDate?: string;
        } = {};
        if (searchPlayerName) params.playerName = searchPlayerName;
        if (startDate) params.startDate = startDate;
        if (dateRange !== "all") params.endDate = endDate;

        const response = await axiosInstance.get<Match[]>(
          `/clubs/${clubId}/matches`,
          { params }
        );

        // 과거 -> 미래 순으로 정렬 (일정관리 리스트뷰와 동일)
        const sortedMatches = [...response.data].sort((a, b) => {
          return (
            new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
          );
        });

        setMatches(sortedMatches);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setMatchesError("경기 기록을 불러오는데 실패했습니다.");
      } finally {
        setMatchesLoading(false);
        isLoadingMatchesRef.current = false;
      }
    },
    [clubId, dateRange]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(playerName || undefined);
  };

  const handleReset = () => {
    setPlayerName("");
    setDateRange("all");
    setMatches([]);
    setMatchesError(null);
  };

  // 미래 경기인지 확인
  const isFutureMatch = (match: Match) => {
    return new Date(match.playedAt) > new Date();
  };

  // 결과가 입력된 과거 경기인지 확인
  const isCompletedMatch = (match: Match) => {
    return match.result !== null && match.result !== undefined;
  };

  // 랭킹 탭 진입 시에만 데이터 로드
  useEffect(() => {
    if (activeTab === "ranking") {
      fetchScoreboard();
    }
  }, [activeTab, fetchScoreboard]);

  // 경기 기록 검색: 검색 후 오늘 날짜로 스크롤
  useEffect(() => {
    if (
      activeTab === "matches" &&
      matches.length > 0 &&
      location.pathname === "/scoreboard"
    ) {
      // DOM이 렌더링될 때까지 대기 후 오늘 날짜로 스크롤
      let attemptCount = 0;
      const maxAttempts = 10;

      const scrollToToday = () => {
        if (todayMatchRef.current) {
          todayMatchRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return true; // 성공
        }
        return false; // 아직 ref가 없음
      };

      // 여러 시점에서 시도 (DOM 렌더링 보장)
      const tryScroll = () => {
        attemptCount++;
        if (!scrollToToday() && attemptCount < maxAttempts) {
          // ref가 아직 없으면 더 기다렸다가 다시 시도
          setTimeout(tryScroll, 100);
        }
      };

      // 즉시 시도
      requestAnimationFrame(() => {
        tryScroll();
      });

      // 추가 시도 (다른 페이지에서 돌아올 때를 대비)
      setTimeout(tryScroll, 100);
      setTimeout(tryScroll, 300);
      setTimeout(tryScroll, 500);
      setTimeout(tryScroll, 800);
    }
  }, [activeTab, matches.length, location.pathname]);

  return (
    <div className="scoreboard-page">
      <div className="scoreboard-header">
        <h1>스코어보드</h1>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "ranking" ? "active" : ""}`}
          onClick={() => setActiveTab("ranking")}
        >
          🏆 랭킹
        </button>
        <button
          className={`tab-button ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          🔍 경기 기록 검색
        </button>
      </div>

      {/* Tab 1: Rankings */}
      {activeTab === "ranking" && (
        <div className="tab-content">
          {/* 연도 및 정렬 필터 */}
          <div className="ranking-filters">
            <div className="ranking-year-filter">
              <label>연도:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  setSelectedYear(year);
                }}
                className="year-select"
              >
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years: number[] = [];

                  // 시작 연도부터 현재 연도까지 역순 (현재 연도가 먼저)
                  for (let year = currentYear; year >= START_YEAR; year--) {
                    years.push(year);
                  }

                  return years.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div className="ranking-sort-filter">
              <label>정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as "points" | "totalMatches" | "winRate"
                  );
                }}
                className="sort-select"
              >
                <option value="points">승점</option>
                <option value="totalMatches">경기수</option>
                <option value="winRate">승률</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>로딩 중...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p>❌ {error}</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="empty-state">
              <p>🏆</p>
              <p>아직 경기 기록이 없습니다.</p>
              <p className="empty-hint">경기를 등록하면 랭킹이 표시됩니다!</p>
            </div>
          ) : (
            <div className="scoreboard-table-container">
              <table className="scoreboard-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>이름</th>
                    <th>경기수</th>
                    <th>승점</th>
                    <th>승률</th>
                    <th>승</th>
                    <th>무</th>
                    <th>패</th>
                    <th>득실</th>
                    <th>득점</th>
                    <th>실점</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry) => (
                    <tr key={entry.userId}>
                      <td className="rank">{entry.rank}</td>
                      <td className="name">{entry.userName}</td>
                      <td>{entry.totalMatches}</td>
                      <td className="points">{entry.points}</td>
                      <td>{entry.winRate}%</td>
                      <td className="wins">{entry.wins}</td>
                      <td>{entry.draws}</td>
                      <td>{entry.losses}</td>
                      <td
                        className={
                          entry.goalDifference >= 0 ? "positive" : "negative"
                        }
                      >
                        {entry.goalDifference > 0 ? "+" : ""}
                        {entry.goalDifference}
                      </td>
                      <td>{entry.totalPointsScored}</td>
                      <td>{entry.totalPointsConceded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Match Search */}
      {activeTab === "matches" && (
        <div className="tab-content">
          {/* 검색 필터 */}
          <div className="filter-section">
            <div className="player-name-input-row">
              <input
                type="text"
                placeholder="선수 이름 검색 (쉼표로 구분: 홍길동, 김철수)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="search-input"
              />
            </div>
            <form onSubmit={handleSearch} className="filter-actions-row">
              <div className="date-range-filter">
                <label>기간:</label>
                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(
                      e.target.value as "all" | "3months" | "6months" | "1year"
                    )
                  }
                >
                  <option value="all">전체</option>
                  <option value="3months">3개월</option>
                  <option value="6months">6개월</option>
                  <option value="1year">1년</option>
                </select>
              </div>
              <button type="submit" className="search-button">
                검색
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="reset-button"
              >
                초기화
              </button>
            </form>
          </div>

          {/* 경기 목록 */}
          <div className="match-list-container">
            {matchesLoading ? (
              <div className="empty-state">
                <p>로딩 중...</p>
              </div>
            ) : matchesError ? (
              <div className="empty-state">
                <p>❌ {matchesError}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>
                  {playerName || dateRange !== "all"
                    ? "검색 결과가 없습니다"
                    : "경기 기록 검색"}
                </h3>
                <p>
                  {playerName || dateRange !== "all"
                    ? "선수 이름이나 기간을 변경하여 다시 검색해보세요"
                    : "선수 이름을 입력하고 검색 버튼을 눌러 경기 기록을 조회하세요"}
                </p>
              </div>
            ) : (
              <div className="match-list">
                {matches.map((match, index) => {
                  const future = isFutureMatch(match);
                  const completed = isCompletedMatch(match);

                  // 오늘 날짜에 가까운 첫 번째 미래 경기 찾기 (일정관리와 동일한 로직)
                  const now = new Date();
                  const matchDate = new Date(match.playedAt);
                  const isFirstFuture =
                    matchDate >= now &&
                    matches
                      .slice(0, index)
                      .every((m) => new Date(m.playedAt) < now);

                  return (
                    <div
                      key={match.id}
                      ref={isFirstFuture ? todayMatchRef : null}
                      className={`match-card ${
                        future
                          ? "future-match"
                          : completed
                          ? "completed-match"
                          : "pending-match"
                      }`}
                    >
                      <div className="match-header-row">
                        <div className="match-date">
                          📅{" "}
                          {format(new Date(match.playedAt), "yyyy-MM-dd HH:mm")}
                        </div>
                        {future && (
                          <div className="match-status-badge future">예정</div>
                        )}
                        {completed && (
                          <div className="match-status-badge completed">
                            완료
                          </div>
                        )}
                      </div>
                      <div className="match-teams-inline">
                        <div
                          className={`team-inline team-a ${
                            completed && match.result === "TEAM_A_WIN"
                              ? "winner"
                              : completed && match.result === "TEAM_B_WIN"
                              ? "loser"
                              : ""
                          }`}
                        >
                          <span className="players-inline">
                            {match.teamAPlayer1Name}
                            {match.teamAPlayer2Name &&
                              ` ${match.teamAPlayer2Name}`}
                          </span>
                          {completed &&
                            match.teamAScore !== undefined &&
                            match.teamBScore !== undefined && (
                              <span className="score-inline">
                                {match.teamAScore}
                              </span>
                            )}
                        </div>
                        <div className="vs-inline">VS</div>
                        <div
                          className={`team-inline team-b ${
                            completed && match.result === "TEAM_B_WIN"
                              ? "winner"
                              : completed && match.result === "TEAM_A_WIN"
                              ? "loser"
                              : ""
                          }`}
                        >
                          {completed &&
                            match.teamAScore !== undefined &&
                            match.teamBScore !== undefined && (
                              <span className="score-inline">
                                {match.teamBScore}
                              </span>
                            )}
                          <span className="players-inline">
                            {match.teamBPlayer1Name}
                            {match.teamBPlayer2Name &&
                              ` ${match.teamBPlayer2Name}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreboardPage;
