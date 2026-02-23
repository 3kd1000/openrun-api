import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import type { Match, MatchPageResponse } from "../../types/match";
import type { AwardRankingResponse, AwardRankingEntry, AwardType, AwardPeriod, Club } from "../../types/club";
import { format } from "date-fns";
import { TrophyIcon, CalendarIcon, SearchIcon, ClipboardListIcon, UserIcon, StarIcon, MedalIcon } from "../../components/common/Icons";
import { getOpenRunSession } from "../../utils/openrunSession";
import { userService, type UserTotalStats, type MyAllMatch } from "../../services/userService";
import { awardService, type AwardPeriodOption } from "../../services/awardService";
import UserNameWithBadge from "../../components/common/UserNameWithBadge";
import { cn } from "../../lib/utils";

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
}

interface ScoreboardResponse {
  rankings: RankingEntry[];
}

type TabType = "ranking" | "matches" | "awards" | "personal";

const ScoreboardPage: React.FC = () => {
  // 클럽 선택 상태는 ClubLayout에서 관리하므로 세션에서만 읽음
  const session = getOpenRunSession();
  const selectedClubId = session.currentClubId ? parseInt(session.currentClubId) : null;

  // 클럽 가입 여부
  const hasClub = !!selectedClubId;

  // 클럽에 가입하지 않은 사용자는 개인기록 탭을 기본으로 설정
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return hasClub ? "ranking" : "personal";
  });

  // Tab 1: Rankings
  const START_YEAR = 2025; // 시작 연도 (하드코딩)
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
  const [genderFilter, setGenderFilter] = useState<"" | "MALE" | "FEMALE">("");

  // Tab 2: Match search (with infinite scroll)
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "3months" | "6months" | "1year"
  >("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMatchesRef = useRef(false);
  const PAGE_SIZE = 20;

  // Tab 3: Personal record (개인기록)
  const [personalStats, setPersonalStats] = useState<UserTotalStats | null>(null);
  const [personalMatches, setPersonalMatches] = useState<MyAllMatch[]>([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalPage, setPersonalPage] = useState(0);
  const [personalHasMore, setPersonalHasMore] = useState(false);
  const [personalTotalElements, setPersonalTotalElements] = useState(0);
  const [isLoadingPersonalMore, setIsLoadingPersonalMore] = useState(false);
  const personalLoadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingPersonalRef = useRef(false);

  // 현재 사용자 이름 (개인기록 탭에서 하이라이팅용)
  const currentUserName = session.userName;

  // Tab 4: Awards (어워드)
  const [awardRankings, setAwardRankings] = useState<AwardRankingResponse[]>([]);
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardError, setAwardError] = useState<string | null>(null);
  const [clubAwardPeriod, setClubAwardPeriod] = useState<AwardPeriod>("HALF_YEAR");
  const [periodOptions, setPeriodOptions] = useState<AwardPeriodOption[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const isLoadingAwardRef = useRef(false);

  // 선수 이름 렌더링 (본인 이름은 Bold 처리)
  const renderPlayerName = (name: string) => {
    if (currentUserName && name === currentUserName) {
      return <strong className="font-bold text-primary">{name}</strong>;
    }
    return name;
  };

  const clubId = selectedClubId || 1; // selectedClubId가 없으면 1 사용
  const isLoadingRef = useRef(false);

  // 클럽 가입 여부에 따라 기본 탭 설정
  useEffect(() => {
    // 클럽에 가입하지 않았는데 클럽 전용 탭이면 personal로 전환
    if (!hasClub && (activeTab === "ranking" || activeTab === "matches" || activeTab === "awards")) {
      setActiveTab("personal");
    }
  }, [hasClub, activeTab]);


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

      const params: {
        startDate: string;
        endDate: string;
        sortBy: string;
        gender?: string;
      } = {
        startDate,
        endDate,
        sortBy,
      };

      // 성별 필터가 선택된 경우에만 파라미터 추가
      if (genderFilter) {
        params.gender = genderFilter;
      }

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
  }, [clubId, selectedYear, sortBy, genderFilter]);

  // Tab 2: Fetch matches (페이징 지원)
  const fetchMatches = useCallback(
    async (searchPlayerName?: string, page: number = 0, append: boolean = false) => {
      if (isLoadingMatchesRef.current) return;

      isLoadingMatchesRef.current = true;
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setMatchesLoading(true);
        }
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

        // API 호출 (페이징 지원)
        const params: {
          playerName?: string;
          startDate?: string;
          endDate?: string;
          page: number;
          size: number;
        } = {
          page,
          size: PAGE_SIZE,
        };
        if (searchPlayerName) params.playerName = searchPlayerName;
        if (startDate) params.startDate = startDate;
        if (dateRange !== "all") params.endDate = endDate;

        const response = await axiosInstance.get<MatchPageResponse>(
          `/clubs/${clubId}/matches/paged`,
          { params }
        );

        const { content, hasMore: more, totalElements: total, page: currentP } = response.data;

        if (append) {
          setMatches((prev) => [...prev, ...content]);
        } else {
          setMatches(content);
        }
        setCurrentPage(currentP);
        setHasMore(more);
        setTotalElements(total);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setMatchesError("경기 기록을 불러오는데 실패했습니다.");
      } finally {
        setMatchesLoading(false);
        setIsLoadingMore(false);
        isLoadingMatchesRef.current = false;
      }
    },
    [clubId, dateRange]
  );

  // 더 불러오기
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMatchesRef.current) {
      fetchMatches(playerName || undefined, currentPage + 1, true);
    }
  }, [hasMore, currentPage, playerName, fetchMatches]);

  // Tab 3: 개인기록 데이터 로드
  const fetchPersonalData = useCallback(async (page: number = 0, append: boolean = false) => {
    if (isLoadingPersonalRef.current) return;

    isLoadingPersonalRef.current = true;
    try {
      if (append) {
        setIsLoadingPersonalMore(true);
      } else {
        setPersonalLoading(true);
      }
      setPersonalError(null);

      // 첫 페이지일 때만 통계도 함께 조회
      if (page === 0 && !append) {
        const statsResponse = await userService.getMyTotalStats();
        setPersonalStats(statsResponse);
      }

      const matchResponse = await userService.getMyAllMatches(page, PAGE_SIZE);
      const { content, hasMore: more, totalElements: total, page: currentP } = matchResponse;

      if (append) {
        setPersonalMatches((prev) => [...prev, ...content]);
      } else {
        setPersonalMatches(content);
      }
      setPersonalPage(currentP);
      setPersonalHasMore(more);
      setPersonalTotalElements(total);
    } catch (err) {
      console.error("Failed to fetch personal data:", err);
      setPersonalError("개인 기록을 불러오는데 실패했습니다.");
    } finally {
      setPersonalLoading(false);
      setIsLoadingPersonalMore(false);
      isLoadingPersonalRef.current = false;
    }
  }, []);

  // 개인기록 더 불러오기
  const loadMorePersonal = useCallback(() => {
    if (personalHasMore && !isLoadingPersonalRef.current) {
      fetchPersonalData(personalPage + 1, true);
    }
  }, [personalHasMore, personalPage, fetchPersonalData]);

  // Tab 4: 어워드 데이터 로드
  const fetchAwardData = useCallback(async (periodIndex: number = 0) => {
    if (isLoadingAwardRef.current || !selectedClubId) return;

    isLoadingAwardRef.current = true;
    try {
      setAwardLoading(true);
      setAwardError(null);

      // 첫 로드 시 클럽 정보에서 award period 가져오기
      if (periodOptions.length === 0) {
        const clubResponse = await axiosInstance.get<Club>(`/clubs/${selectedClubId}`);
        const period = clubResponse.data.awardPeriod || "HALF_YEAR";
        setClubAwardPeriod(period);

        // 기간 옵션 생성
        const options = awardService.generatePeriodOptions(period, 6);
        setPeriodOptions(options);
      }

      // 선택된 기간으로 수상자 조회 (확정된 수상 기록)
      const currentOptions = periodOptions.length > 0
        ? periodOptions
        : awardService.generatePeriodOptions(clubAwardPeriod, 6);

      const selectedOption = currentOptions[periodIndex];
      if (selectedOption) {
        const winners = await awardService.getAwardWinners(
          selectedClubId,
          selectedOption.startDate,
          selectedOption.endDate
        );

        // AwardWinnerResponse[] → AwardRankingResponse[] 변환 (awardType별 그룹핑)
        const typeMap = new Map<AwardType, AwardRankingEntry[]>();
        winners.forEach((w) => {
          const entries = typeMap.get(w.awardType) || [];
          entries.push({
            rank: entries.length + 1,
            userId: w.userId,
            userName: w.userName,
            value: w.value,
          });
          typeMap.set(w.awardType, entries);
        });

        const rankings: AwardRankingResponse[] = Array.from(typeMap.entries()).map(
          ([type, entries]) => ({
            type,
            period: clubAwardPeriod,
            startDate: selectedOption.startDate,
            endDate: selectedOption.endDate,
            rankings: entries,
          })
        );
        setAwardRankings(rankings);
      }
    } catch (err) {
      console.error("Failed to fetch award data:", err);
      setAwardError("어워드 정보를 불러오는데 실패했습니다.");
    } finally {
      setAwardLoading(false);
      isLoadingAwardRef.current = false;
    }
  }, [selectedClubId, periodOptions, clubAwardPeriod]);

  // 기간 선택 변경 핸들러
  const handlePeriodChange = (index: number) => {
    setSelectedPeriodIndex(index);
    fetchAwardData(index);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(playerName || undefined);
  };

  const handleReset = () => {
    setPlayerName("");
    setDateRange("all");
    setMatches([]);
    setMatchesError(null);
    setCurrentPage(0);
    setHasMore(false);
    setTotalElements(0);
  };

  // IntersectionObserver for infinite scroll (matches tab)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const current = loadMoreRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  // IntersectionObserver for infinite scroll (personal tab)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && personalHasMore && !isLoadingPersonalMore) {
          loadMorePersonal();
        }
      },
      { threshold: 0.1 }
    );

    const current = personalLoadMoreRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [personalHasMore, isLoadingPersonalMore, loadMorePersonal]);

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

  // 개인기록 탭 진입 시에만 데이터 로드
  useEffect(() => {
    if (activeTab === "personal" && personalStats === null) {
      fetchPersonalData();
    }
  }, [activeTab, personalStats, fetchPersonalData]);

  // 어워드 탭 진입 시에만 데이터 로드
  useEffect(() => {
    if (activeTab === "awards" && awardRankings.length === 0) {
      fetchAwardData(0);
    }
  }, [activeTab, awardRankings.length, fetchAwardData]);

  return (
    <div className="w-full px-3 md:pb-4">
      {/* Tab Navigation */}
      <div className="flex mb-4 border-b border-border">
        {/* 클럽 가입 시에만 랭킹/경기 기록 탭 표시 */}
        {hasClub && (
          <>
            <button
              className={cn(
                "flex items-center justify-center gap-1 px-4 py-3 bg-transparent border-b-2 border-transparent text-sm font-semibold text-muted-foreground cursor-pointer transition-all -mb-[2px] min-h-[44px]",
                "hover:text-foreground/70",
                "max-md:flex-1 max-md:px-1 max-md:py-2 max-md:text-xs max-md:min-h-[40px] max-md:gap-0.5",
                activeTab === "ranking" && "text-primary border-b-primary"
              )}
              onClick={() => setActiveTab("ranking")}
            >
              <TrophyIcon size={20} />
              <span>랭킹</span>
            </button>
            <button
              className={cn(
                "flex items-center justify-center gap-1 px-4 py-3 bg-transparent border-b-2 border-transparent text-sm font-semibold text-muted-foreground cursor-pointer transition-all -mb-[2px] min-h-[44px]",
                "hover:text-foreground/70",
                "max-md:flex-1 max-md:px-1 max-md:py-2 max-md:text-xs max-md:min-h-[40px] max-md:gap-0.5",
                activeTab === "matches" && "text-primary border-b-primary"
              )}
              onClick={() => setActiveTab("matches")}
            >
              <ClipboardListIcon size={20} />
              <span>경기기록</span>
            </button>
            <button
              className={cn(
                "flex items-center justify-center gap-1 px-4 py-3 bg-transparent border-b-2 border-transparent text-sm font-semibold text-muted-foreground cursor-pointer transition-all -mb-[2px] min-h-[44px]",
                "hover:text-foreground/70",
                "max-md:flex-1 max-md:px-1 max-md:py-2 max-md:text-xs max-md:min-h-[40px] max-md:gap-0.5",
                activeTab === "awards" && "text-primary border-b-primary"
              )}
              onClick={() => setActiveTab("awards")}
            >
              <StarIcon size={20} />
              <span>어워드</span>
            </button>
          </>
        )}
        <button
          className={cn(
            "flex items-center justify-center gap-1 px-4 py-3 bg-transparent border-b-2 border-transparent text-sm font-semibold text-muted-foreground cursor-pointer transition-all -mb-[2px] min-h-[44px]",
            "hover:text-foreground/70",
            "max-md:flex-1 max-md:px-1 max-md:py-2 max-md:text-xs max-md:min-h-[40px] max-md:gap-0.5",
            activeTab === "personal" && "text-primary border-b-primary"
          )}
          onClick={() => setActiveTab("personal")}
        >
          <UserIcon size={20} />
          <span>개인기록</span>
        </button>
      </div>

      {/* Tab 1: Rankings */}
      {activeTab === "ranking" && (
        <div className="min-h-[200px]">
          {/* 연도, 성별 및 정렬 필터 */}
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white rounded-lg border border-border max-md:p-2 max-md:mb-3 max-md:gap-2">
            <div className="flex items-center gap-2 max-md:flex-1 max-md:min-w-0">
              <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap max-md:text-xs">연도:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  setSelectedYear(year);
                }}
                className="px-3 py-2 border border-border rounded text-sm cursor-pointer max-md:flex-1 max-md:px-2 max-md:py-1 max-md:text-xs max-md:min-w-0"
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
            <div className="flex items-center gap-2 max-md:flex-1 max-md:min-w-0">
              <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap max-md:text-xs">성별:</label>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value as "" | "MALE" | "FEMALE");
                }}
                className="px-3 py-2 border border-border rounded text-sm cursor-pointer max-md:flex-1 max-md:px-2 max-md:py-1 max-md:text-xs max-md:min-w-0"
              >
                <option value="">전체</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>
            <div className="flex items-center gap-2 max-md:flex-1 max-md:min-w-0">
              <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap max-md:text-xs">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as "points" | "totalMatches" | "winRate"
                  );
                }}
                className="px-3 py-2 border border-border rounded text-sm cursor-pointer max-md:flex-1 max-md:px-2 max-md:py-1 max-md:text-xs max-md:min-w-0"
              >
                <option value="points">승점</option>
                <option value="totalMatches">경기수</option>
                <option value="winRate">승률</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>❌ {error}</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p className="text-5xl mb-3 max-md:text-4xl">
                <TrophyIcon size={64} color="var(--color-text-secondary)" />
              </p>
              <p>아직 경기 기록이 없습니다.</p>
              <p className="text-muted-foreground/60 text-sm">경기를 등록하면 랭킹이 표시됩니다!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md border border-border">
              <table className="w-full border-collapse bg-white text-[13px] text-foreground max-md:text-xs">
                <thead className="bg-primary text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">순위</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">이름</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">경기수</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">승점</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">승률</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">승</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 max-md:px-[3px] max-md:py-1">무</th>
                    <th className="py-2 px-2 text-center font-semibold whitespace-nowrap last:border-r-0 max-md:px-[3px] max-md:py-1">패</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry) => (
                    <tr key={entry.userId} className="border-b border-border/50 transition-colors hover:bg-muted">
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-bold text-primary text-base max-md:text-sm">{entry.rank}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-semibold text-foreground"><UserNameWithBadge userId={entry.userId} userName={entry.userName} /></td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-medium text-foreground">{entry.totalMatches}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-bold text-[#ff6600]">{entry.points}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-medium text-foreground">{entry.winRate}%</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 text-[#17a2b8] font-semibold">{entry.wins}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap border-r border-border/50 font-medium text-foreground">{entry.draws}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap font-medium text-foreground">{entry.losses}</td>
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
        <div className="min-h-[200px]">
          {/* 검색 필터 */}
          <div className="bg-white rounded-lg border border-border p-4 mb-3 max-md:p-3">
            <div className="mb-3">
              <input
                type="text"
                placeholder="선수 이름 검색 (쉼표로 구분: 홍길동, 김철수)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 items-center max-md:gap-1 max-[359px]:flex-wrap">
              <div className="flex items-center gap-2 shrink-0 max-md:flex-1 max-md:min-w-0 max-md:gap-1 max-[359px]:basis-full max-[359px]:order-1">
                <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap max-md:text-xs">기간:</label>
                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(
                      e.target.value as "all" | "3months" | "6months" | "1year"
                    )
                  }
                  className="px-3 py-2 border border-border rounded text-sm cursor-pointer max-md:flex-1 max-md:px-2 max-md:py-1 max-md:text-xs max-md:min-w-0"
                >
                  <option value="all">전체</option>
                  <option value="3months">3개월</option>
                  <option value="6months">6개월</option>
                  <option value="1year">1년</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded text-sm font-semibold cursor-pointer transition-colors shrink-0 hover:bg-primary/90 max-md:flex-1 max-md:min-w-0 max-[359px]:order-2">
                검색
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-muted-foreground rounded text-sm font-semibold cursor-pointer transition-colors shrink-0 hover:bg-gray-200 max-md:flex-1 max-md:min-w-0 max-[359px]:order-2"
              >
                초기화
              </button>
            </form>
          </div>

          {/* 경기 목록 */}
          <div className="min-h-[200px]">
            {matchesLoading ? (
              <div className="text-center py-[60px] px-4 text-muted-foreground">
                <p>로딩 중...</p>
              </div>
            ) : matchesError ? (
              <div className="text-center py-[60px] px-4 text-muted-foreground">
                <p>❌ {matchesError}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-[60px] px-4 text-muted-foreground">
                <div className="text-5xl mb-3 max-md:text-4xl">
                  <SearchIcon size={64} color="var(--color-text-secondary)" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  {playerName || dateRange !== "all"
                    ? "검색 결과가 없습니다"
                    : "경기 기록 검색"}
                </p>
                <p className="text-sm">
                  {playerName || dateRange !== "all"
                    ? "선수 이름이나 기간을 변경하여 다시 검색해보세요"
                    : "선수 이름을 입력하고 검색 버튼을 눌러 경기 기록을 조회하세요"}
                </p>
              </div>
            ) : (
              <>
                {/* 총 건수 표시 */}
                <div className="flex justify-between items-center py-2 mb-2 text-muted-foreground text-sm">
                  <span className="font-medium">총 {totalElements}건</span>
                </div>
                <div className="flex flex-col gap-2 max-md:gap-1">
                  {matches.map((match) => {
                    const future = isFutureMatch(match);
                    const completed = isCompletedMatch(match);

                    return (
                      <div
                        key={match.id}
                        className={cn(
                          "relative border rounded-lg p-4 bg-white transition-colors text-xs md:text-sm max-md:p-3",
                          future && "border-primary hover:border-primary/80 hover:bg-primary/5",
                          completed && "border-[#28a745] hover:border-[#28a745]/80 hover:bg-[#28a745]/5",
                          !future && !completed && "border-[#ffc107] hover:border-[#ffc107]/80 hover:bg-[#ffc107]/5"
                        )}
                      >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border max-md:mb-1 max-md:pb-1">
                        <div className="text-primary font-semibold flex-1 flex items-center gap-1">
                          <CalendarIcon size={16} />
                          <span>{format(new Date(match.playedAt), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                        {future && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-primary text-white ml-1">예정</span>
                        )}
                        {completed && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-[#28a745] text-white ml-1">완료</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded max-md:gap-0.5 max-md:p-1">
                        <div
                          className={cn(
                            "flex-1 flex items-center gap-1 px-2 py-1 rounded bg-white transition-colors max-md:px-1 max-md:py-0.5 max-md:gap-0.5 max-md:min-w-0",
                            completed && match.result === "TEAM_A_WIN" && "bg-[#f0fff4] border-l-[3px] border-l-[#28a745]",
                            completed && match.result === "TEAM_B_WIN" && "bg-[#fff5f5] border-l-[3px] border-l-destructive opacity-90"
                          )}
                        >
                          <span className={cn(
                            "flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                            completed && match.result === "TEAM_A_WIN" && "text-[#28a745] font-bold"
                          )}>
                            <UserNameWithBadge userId={match.teamAPlayer1Id} userName={match.teamAPlayer1Name} />
                            {match.teamAPlayer2Id && match.teamAPlayer2Name &&
                              <> <UserNameWithBadge userId={match.teamAPlayer2Id} userName={match.teamAPlayer2Name} /></>}
                          </span>
                          {completed &&
                            match.teamAScore !== undefined &&
                            match.teamBScore !== undefined && (
                              <span className="font-bold text-muted-foreground px-1 py-0.5 min-w-[24px] text-center shrink-0 bg-gray-200 rounded max-md:min-w-[20px]">
                                {match.teamAScore}
                              </span>
                            )}
                        </div>
                        <div className="text-muted-foreground px-1 font-bold max-[359px]:px-0.5 shrink-0">VS</div>
                        <div
                          className={cn(
                            "flex-1 flex items-center gap-1 px-2 py-1 rounded bg-white transition-colors max-md:px-1 max-md:py-0.5 max-md:gap-0.5 max-md:min-w-0",
                            completed && match.result === "TEAM_B_WIN" && "bg-[#f0fff4] border-l-[3px] border-l-[#28a745]",
                            completed && match.result === "TEAM_A_WIN" && "bg-[#fff5f5] border-l-[3px] border-l-destructive opacity-90"
                          )}
                        >
                          {completed &&
                            match.teamAScore !== undefined &&
                            match.teamBScore !== undefined && (
                              <span className="font-bold text-muted-foreground px-1 py-0.5 min-w-[24px] text-center shrink-0 bg-gray-200 rounded max-md:min-w-[20px]">
                                {match.teamBScore}
                              </span>
                            )}
                          <span className={cn(
                            "flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                            completed && match.result === "TEAM_B_WIN" && "text-[#28a745] font-bold"
                          )}>
                            <UserNameWithBadge userId={match.teamBPlayer1Id} userName={match.teamBPlayer1Name} />
                            {match.teamBPlayer2Id && match.teamBPlayer2Name &&
                              <> <UserNameWithBadge userId={match.teamBPlayer2Id} userName={match.teamBPlayer2Name} /></>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
                {/* 인피니티 스크롤 로딩 표시 */}
                <div ref={loadMoreRef} className="flex justify-center py-4 min-h-[60px]">
                  {isLoadingMore && (
                    <div className="text-muted-foreground text-sm">불러오는 중...</div>
                  )}
                  {!hasMore && matches.length > 0 && (
                    <div className="text-muted-foreground/60 text-sm">모든 경기를 불러왔습니다</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Awards */}
      {activeTab === "awards" && (
        <div className="min-h-[200px]">
          {/* 기간 선택 */}
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white rounded-lg border border-border max-md:px-2 max-md:py-1 max-md:mb-2">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">기간:</label>
            <select
              value={selectedPeriodIndex}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
              className="flex-1 px-2 py-1 border border-border rounded text-xs cursor-pointer max-w-[180px] max-md:max-w-none disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={awardLoading}
            >
              {periodOptions.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {awardLoading ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>로딩 중...</p>
            </div>
          ) : awardError ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>{awardError}</p>
            </div>
          ) : awardRankings.length === 0 ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <div className="text-5xl mb-3 max-md:text-4xl">
                <StarIcon size={64} color="var(--color-text-secondary)" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">수상 기록이 없습니다</p>
              <p className="text-sm">해당 기간의 수상 기록이 아직 등록되지 않았습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-md:gap-1">
              {awardRankings.map((award) => (
                <div key={award.type} className="bg-white border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-gradient-to-br from-primary to-primary/80 text-white max-md:px-2 max-md:py-1">
                    <span className="text-sm font-bold max-md:text-xs">
                      {awardService.getAwardTypeName(award.type)}
                    </span>
                  </div>
                  {award.rankings.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                      기록이 없습니다
                    </div>
                  ) : (
                    <div className="p-0.5">
                      {award.rankings.map((entry, index) => (
                        <div
                          key={entry.userId}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 border-b border-border/50 last:border-b-0 max-md:px-2 max-md:py-1 max-md:gap-1",
                            index === 0 && "bg-gradient-to-r from-[#fffbf0] to-transparent"
                          )}
                        >
                          <span className="flex items-center justify-center min-w-[28px]">
                            {index === 0 ? (
                              <MedalIcon size={24} rank={1} />
                            ) : index === 1 ? (
                              <MedalIcon size={20} rank={2} />
                            ) : (
                              <MedalIcon size={18} rank={3} />
                            )}
                          </span>
                          <span className={cn(
                            "flex-1 text-sm font-medium text-foreground max-md:text-xs",
                            index === 0 && "text-[13px] font-bold max-md:text-sm"
                          )}>
                            <UserNameWithBadge userId={entry.userId} userName={entry.userName} />
                          </span>
                          <span className={cn(
                            "text-sm font-bold text-primary whitespace-nowrap max-md:text-xs",
                            index === 0 && "text-[13px] text-[#ffc107] max-md:text-sm"
                          )}>
                            {entry.value}{awardService.getAwardTypeUnit(award.type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Personal Record */}
      {activeTab === "personal" && (
        <div className="min-h-[200px]">
          {personalLoading ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>로딩 중...</p>
            </div>
          ) : personalError ? (
            <div className="text-center py-[60px] px-4 text-muted-foreground">
              <p>{personalError}</p>
            </div>
          ) : (
            <>
              {/* 통계 박스 */}
              {personalStats && (
                <div className="bg-white rounded-lg border border-border p-4 mb-4 text-center max-md:p-3 max-md:mb-3">
                  <div className="flex justify-center gap-3 mb-3 max-md:gap-2">
                    <div className="flex flex-row items-center justify-center gap-1 px-5 py-3 rounded-lg min-w-[80px] bg-[#e8f5e9] border border-[#28a745] max-md:px-3 max-md:py-2 max-md:min-w-[60px] max-md:flex-1">
                      <span className="text-2xl font-bold leading-tight text-[#28a745] max-md:text-xl">{personalStats.wins}</span>
                      <span className="text-sm font-semibold text-muted-foreground max-md:text-xs">승</span>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-1 px-5 py-3 rounded-lg min-w-[80px] bg-gray-200 border border-border max-md:px-3 max-md:py-2 max-md:min-w-[60px] max-md:flex-1">
                      <span className="text-2xl font-bold leading-tight text-muted-foreground max-md:text-xl">{personalStats.draws}</span>
                      <span className="text-sm font-semibold text-muted-foreground max-md:text-xs">무</span>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-1 px-5 py-3 rounded-lg min-w-[80px] bg-[#fff5f5] border border-destructive max-md:px-3 max-md:py-2 max-md:min-w-[60px] max-md:flex-1">
                      <span className="text-2xl font-bold leading-tight text-destructive max-md:text-xl">{personalStats.losses}</span>
                      <span className="text-sm font-semibold text-muted-foreground max-md:text-xs">패</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground/60 font-medium max-md:text-xs">
                    총 {personalStats.totalMatches}경기
                  </div>
                </div>
              )}

              {/* 경기 목록 */}
              <div className="min-h-[200px]">
                {personalMatches.length === 0 ? (
                  <div className="text-center py-[60px] px-4 text-muted-foreground">
                    <div className="text-5xl mb-3 max-md:text-4xl">
                      <UserIcon size={64} color="var(--color-text-secondary)" />
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1">아직 경기 기록이 없습니다</p>
                    <p className="text-sm">경기에 참여하면 여기에 기록이 표시됩니다</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center py-2 mb-2 text-muted-foreground text-sm">
                      <span className="font-medium">총 {personalTotalElements}건</span>
                    </div>
                    <div className="flex flex-col gap-2 max-md:gap-1">
                      {personalMatches.map((match) => (
                        <div
                          key={match.matchId}
                          className="relative border border-[#28a745] rounded-lg p-4 bg-white transition-colors text-xs md:text-sm max-md:p-3 hover:border-[#28a745]/80 hover:bg-[#28a745]/5"
                        >
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border max-md:mb-1 max-md:pb-1">
                            <div className="text-primary font-semibold flex-1 flex items-center gap-1">
                              <CalendarIcon size={16} />
                              <span>{format(new Date(match.playedAt), "yyyy-MM-dd HH:mm")}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] max-md:text-[10px] max-md:px-1 max-md:max-w-[120px]">
                              {match.clubName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted rounded max-md:gap-0.5 max-md:p-1">
                            <div
                              className={cn(
                                "flex-1 flex items-center gap-1 px-2 py-1 rounded bg-white transition-colors max-md:px-1 max-md:py-0.5 max-md:gap-0.5 max-md:min-w-0",
                                match.result === "TEAM_A_WIN" && "bg-[#f0fff4] border-l-[3px] border-l-[#28a745]",
                                match.result === "TEAM_B_WIN" && "bg-[#fff5f5] border-l-[3px] border-l-destructive opacity-90"
                              )}
                            >
                              <span className={cn(
                                "flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                                match.result === "TEAM_A_WIN" && "text-[#28a745] font-bold"
                              )}>
                                {renderPlayerName(match.teamAPlayer1Name)}
                                {match.teamAPlayer2Name && <> {renderPlayerName(match.teamAPlayer2Name)}</>}
                              </span>
                              <span className="font-bold text-muted-foreground px-1 py-0.5 min-w-[24px] text-center shrink-0 bg-gray-200 rounded max-md:min-w-[20px]">{match.teamAScore}</span>
                            </div>
                            <div className="text-muted-foreground px-1 font-bold max-[359px]:px-0.5 shrink-0">VS</div>
                            <div
                              className={cn(
                                "flex-1 flex items-center gap-1 px-2 py-1 rounded bg-white transition-colors max-md:px-1 max-md:py-0.5 max-md:gap-0.5 max-md:min-w-0",
                                match.result === "TEAM_B_WIN" && "bg-[#f0fff4] border-l-[3px] border-l-[#28a745]",
                                match.result === "TEAM_A_WIN" && "bg-[#fff5f5] border-l-[3px] border-l-destructive opacity-90"
                              )}
                            >
                              <span className="font-bold text-muted-foreground px-1 py-0.5 min-w-[24px] text-center shrink-0 bg-gray-200 rounded max-md:min-w-[20px]">{match.teamBScore}</span>
                              <span className={cn(
                                "flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0",
                                match.result === "TEAM_B_WIN" && "text-[#28a745] font-bold"
                              )}>
                                {renderPlayerName(match.teamBPlayer1Name)}
                                {match.teamBPlayer2Name && <> {renderPlayerName(match.teamBPlayer2Name)}</>}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* 인피니티 스크롤 로딩 표시 */}
                    <div ref={personalLoadMoreRef} className="flex justify-center py-4 min-h-[60px]">
                      {isLoadingPersonalMore && (
                        <div className="text-muted-foreground text-sm">불러오는 중...</div>
                      )}
                      {!personalHasMore && personalMatches.length > 0 && (
                        <div className="text-muted-foreground/60 text-sm">모든 경기를 불러왔습니다</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreboardPage;
