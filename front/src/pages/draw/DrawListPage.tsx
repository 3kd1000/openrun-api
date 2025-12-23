import React, { useEffect, useState, useRef, useCallback } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import { scheduleService } from "../../services/scheduleService";
import { participantService } from "../../services/participantService";
import type { Match } from "../../types/match";
import type { Schedule, Participant } from "../../types/schedule";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import DrawViewModal from "../schedule/components/DrawViewModal";
import "./DrawListPage.css";

type TabType = "schedules" | "matches";

const DrawListPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("schedules");

  // Tab 1: Schedules with draws
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Tab 2: Match search
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // 검색 필터 (Tab 2)
  const [playerName, setPlayerName] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "1week" | "1month" | "3months"
  >("all");

  // DrawViewModal state
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [participants, setParticipants] = useState<Participant[]>([]);

  // 오늘 날짜에 가까운 매치로 스크롤하기 위한 ref
  const matchRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isLoadingSchedulesRef = useRef(false);
  const isLoadingMatchesRef = useRef(false);

  const clubId = 1; // TODO: Context나 URL param에서 가져오기

  // Tab 1: Fetch schedules that have draws
  const fetchSchedulesWithDraws = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingSchedulesRef.current) return;

    isLoadingSchedulesRef.current = true;
    try {
      setSchedulesLoading(true);
      setSchedulesError(null);

      const allSchedules = await scheduleService.getSchedulesByClubId(clubId);

      // Filter schedules that have drawType (대진이 생성된 일정만)
      const schedulesWithDraws = allSchedules.filter(
        (schedule) => schedule.drawType != null
      );

      // Sort by scheduled date (latest first)
      schedulesWithDraws.sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      setSchedules(schedulesWithDraws);
    } catch (err) {
      console.error("Failed to fetch schedules with draws:", err);
      setSchedulesError("대진이 있는 일정을 불러오는데 실패했습니다.");
    } finally {
      setSchedulesLoading(false);
      isLoadingSchedulesRef.current = false;
    }
  }, [clubId]);

  // Tab 1: Load schedules with draws on mount
  useEffect(() => {
    if (activeTab === "schedules") {
      fetchSchedulesWithDraws();
    }
  }, [activeTab, fetchSchedulesWithDraws]);

  // Tab 2: Fetch matches
  const fetchMatches = useCallback(
    async (searchPlayerName?: string) => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoadingMatchesRef.current) return;

      isLoadingMatchesRef.current = true;
      try {
        setMatchesLoading(true);
        setMatchesError(null);

        // 기간 계산
        let startDate: string | undefined;
        const endDate = new Date().toISOString();

        if (dateRange === "1week") {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          startDate = date.toISOString();
        } else if (dateRange === "1month") {
          const date = new Date();
          date.setMonth(date.getMonth() - 1);
          startDate = date.toISOString();
        } else if (dateRange === "3months") {
          const date = new Date();
          date.setMonth(date.getMonth() - 3);
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

        setMatches(response.data);

        // 검색 완료 후 오늘 날짜에 가까운 매치로 스크롤
        setTimeout(() => scrollToTodayMatch(response.data), 100);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setMatchesError("대진 목록을 불러오는데 실패했습니다.");
      } finally {
        setMatchesLoading(false);
        isLoadingMatchesRef.current = false;
      }
    },
    [clubId, dateRange]
  );

  // 오늘 날짜에 가까운 매치로 스크롤
  const scrollToTodayMatch = (matchList: Match[]) => {
    if (matchList.length === 0) return;

    const now = new Date();

    // 오늘 날짜와 가장 가까운 매치 찾기
    let closestMatchIndex = 0;
    let minDiff = Math.abs(
      new Date(matchList[0].playedAt).getTime() - now.getTime()
    );

    matchList.forEach((match, index) => {
      const diff = Math.abs(new Date(match.playedAt).getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestMatchIndex = index;
      }
    });

    // 해당 매치로 스크롤
    const targetRef = matchRefs.current.get(matchList[closestMatchIndex].id);
    if (targetRef) {
      targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(playerName || undefined);
  };

  const handleReset = () => {
    setPlayerName("");
    setDateRange("all");
    fetchMatches();
  };

  // Schedule click handler - open DrawViewModal
  const handleScheduleClick = async (schedule: Schedule) => {
    try {
      // Fetch participants for this schedule
      const participantsList = await participantService.getParticipants(
        schedule.id
      );
      setParticipants(participantsList);
      setSelectedSchedule(schedule);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    }
  };

  const handleCloseDrawModal = () => {
    setSelectedSchedule(null);
    setParticipants([]);
  };

  const handleDrawModalSuccess = () => {
    fetchSchedulesWithDraws(); // Refresh schedule list
  };

  // 미래 경기인지 확인
  const isFutureMatch = (match: Match) => {
    return new Date(match.playedAt) > new Date();
  };

  // 결과가 입력된 과거 경기인지 확인
  const isCompletedMatch = (match: Match) => {
    return match.result !== null && match.result !== undefined;
  };

  return (
    <div className="draw-list-page">
      <div className="page-header">
        <h1>대진 목록</h1>
        <p className="page-description">
          일정별로 생성된 대진표를 확인하고 경기 결과를 검색하세요
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "schedules" ? "active" : ""}`}
          onClick={() => setActiveTab("schedules")}
        >
          📅 일정별 대진
        </button>
        <button
          className={`tab-button ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          🔍 대진 기록 검색
        </button>
      </div>

      {/* Tab 1: Schedules with Draws */}
      {activeTab === "schedules" && (
        <div className="tab-content">
          {schedulesLoading ? (
            <div className="empty-state">
              <p>로딩 중...</p>
            </div>
          ) : schedulesError ? (
            <div className="empty-state">
              <p>❌ {schedulesError}</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>생성된 대진이 없습니다</h3>
              <p>일정 관리에서 일정을 만들고 대진표를 생성해보세요</p>
            </div>
          ) : (
            <div className="schedule-list">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="schedule-card"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  <div className="schedule-header">
                    <h3 className="schedule-court">{schedule.courtName}</h3>
                    <span
                      className={`draw-type-badge ${schedule.drawType?.toLowerCase()}`}
                    >
                      {schedule.drawType}
                    </span>
                  </div>
                  <div className="schedule-datetime">
                    📅{" "}
                    {format(
                      new Date(schedule.scheduledAt),
                      "yyyy년 M월 d일 (E) HH:mm",
                      { locale: ko }
                    )}
                  </div>
                  <div className="schedule-info">
                    <span className="info-item">
                      👥 {schedule.currentParticipants}/{schedule.maxCapacity}명
                    </span>
                    {schedule.cost && (
                      <span className="info-item">
                        💰 {schedule.cost.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <div
                    className={`draw-validity ${
                      schedule.isDrawValid ? "valid" : "invalid"
                    }`}
                  >
                    {schedule.isDrawValid ? (
                      <>✓ 유효한 대진표</>
                    ) : (
                      <>⚠️ 재생성 필요</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Match Search */}
      {activeTab === "matches" && (
        <div className="tab-content">
          {/* 검색 필터 */}
          <div className="filter-section">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="선수 이름 검색"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="search-input"
              />
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

            <div className="date-range-filter">
              <label>기간:</label>
              <select
                value={dateRange}
                onChange={(e) =>
                  setDateRange(
                    e.target.value as "all" | "1week" | "1month" | "3months"
                  )
                }
              >
                <option value="all">전체</option>
                <option value="1week">1주일</option>
                <option value="1month">1개월</option>
                <option value="3months">3개월</option>
              </select>
            </div>
          </div>

          {/* 대진 목록 */}
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
                <h3>검색 결과가 없습니다</h3>
                <p>선수 이름이나 기간을 입력하여 경기 기록을 검색해보세요</p>
              </div>
            ) : (
              <div className="match-list">
                {matches.map((match) => {
                  const future = isFutureMatch(match);
                  const completed = isCompletedMatch(match);

                  return (
                    <div
                      key={match.id}
                      ref={(el) => {
                        if (el) matchRefs.current.set(match.id, el);
                        else matchRefs.current.delete(match.id);
                      }}
                      className={`match-card ${
                        future
                          ? "future-match"
                          : completed
                          ? "completed-match"
                          : "pending-match"
                      }`}
                    >
                      {future && (
                        <div className="match-status-badge future">예정</div>
                      )}
                      {completed && (
                        <div className="match-status-badge completed">완료</div>
                      )}

                      <div className="match-date">
                        📅{" "}
                        {format(new Date(match.playedAt), "yyyy-MM-dd HH:mm")}
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
                          <span className="team-label-inline">Team A</span>
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
                          <span className="team-label-inline">Team B</span>
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

      {/* DrawViewModal */}
      {selectedSchedule && (
        <DrawViewModal
          schedule={selectedSchedule}
          participants={participants}
          onClose={handleCloseDrawModal}
          onSuccess={handleDrawModalSuccess}
        />
      )}
    </div>
  );
};

export default DrawListPage;
