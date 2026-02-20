import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { useAuth } from "../../../contexts/AuthContext";
import { getOpenRunSession } from "../../../utils/openrunSession";
import RegionSelector from "../../../components/common/RegionSelector";
import DateRangePicker from "../../../components/common/DateRangePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ScheduleCard from "@/components/openrun/schedule-card";
import ClubCard from "@/components/openrun/club-card";
import EmptyState from "@/components/openrun/empty-state";
import { Search, CalendarSearch, Users } from "lucide-react";
import "./ClubExplorePage.css";

type TabType = "guest" | "member";
type RecruitType = "GUEST" | "INTERCLUB";
type MatchTypeFilter = "" | "MEN_DOUBLES" | "WOMEN_DOUBLES" | "MIXED_DOUBLES" | "SINGLES";

// URL 파라미터에서 Date 파싱
const parseDateParam = (param: string | null): Date | null => {
  if (!param) return null;
  const parsed = new Date(param);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Date를 URL 파라미터용 문자열로 변환
const formatDateParam = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface PublicRecruitSchedule {
  scheduleId: number;
  clubId: number;
  clubName: string;
  clubRegion?: string | null;
  recruitType: RecruitType;
  matchType?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
  courtName: string;
  currentParticipants: number;
  maxCapacity: number;
  cost?: number | null;
  note?: string | null;
}

interface ClubListResponse {
  content: Club[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const formatDateForApi = formatDateParam;

// 스켈레톤 컴포넌트
const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border p-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-1.5 w-full mt-3" />
      </div>
    ))}
  </div>
);

const ClubExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: firebaseUser } = useAuth();

  // 초기 탭 결정: URL 파라미터 > location.state > 기본값(guest)
  const initialTab = useMemo(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "member" || tabFromUrl === "guest") {
      return tabFromUrl as TabType;
    }
    const state = location.state as { defaultTab?: TabType } | null;
    if (state?.defaultTab === "member" || state?.defaultTab === "guest") {
      return state.defaultTab;
    }
    return "guest" as TabType;
  }, [searchParams, location.state]);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 게스트 모집 상태 - URL에서 초기값 읽기
  const [guestItems, setGuestItems] = useState<PublicRecruitSchedule[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestLoaded, setGuestLoaded] = useState(false);
  const [guestKeyword, setGuestKeyword] = useState(() => searchParams.get("guestKeyword") || "");
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>(
    () => (searchParams.get("matchType") as MatchTypeFilter) || ""
  );
  const [guestRegionDepth1, setGuestRegionDepth1] = useState(() => searchParams.get("guestRegion1") || "");
  const [guestRegionDepth2, setGuestRegionDepth2] = useState(() => searchParams.get("guestRegion2") || "");
  const [fromDate, setFromDate] = useState<Date | null>(() => parseDateParam(searchParams.get("fromDate")));
  const [toDate, setToDate] = useState<Date | null>(() => parseDateParam(searchParams.get("toDate")));
  const [includeClubSchedules, setIncludeClubSchedules] = useState(
    () => searchParams.get("includeClub") !== "false"
  );

  // 클럽모집 상태 - URL에서 초기값 읽기
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubsLoaded, setClubsLoaded] = useState(false);
  const [clubKeyword, setClubKeyword] = useState(() => searchParams.get("clubKeyword") || "");
  const [clubRegionDepth1, setClubRegionDepth1] = useState(() => searchParams.get("clubRegion1") || "");
  const [clubRegionDepth2, setClubRegionDepth2] = useState(() => searchParams.get("clubRegion2") || "");
  const [clubError, setClubError] = useState<string | null>(null);

  // 초기 마운트 시 fromClubId를 저장
  const [savedFromClubId] = useState(() => {
    const state = location.state as { fromClubId?: string | number } | null;
    const raw = state?.fromClubId;
    if (raw === null || raw === undefined) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? String(n) : null;
  });

  const shouldShowBack = Boolean(firebaseUser && savedFromClubId);

  // URL 파라미터 업데이트 헬퍼 (기존 파라미터 유지하면서 업데이트)
  const updateSearchParams = useCallback((updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateSearchParams({ tab });
  };

  // 게스트 모집 데이터 로드
  const loadGuestRecruit = async () => {
    try {
      setGuestLoading(true);
      const res = await axiosInstance.get<PublicRecruitSchedule[]>("/schedules/recruit", {
        params: {
          type: "GUEST",
          matchType: matchTypeFilter || undefined,
          fromDate: formatDateForApi(fromDate),
          toDate: formatDateForApi(toDate),
          limit: 50
        },
      });
      setGuestItems(res.data);
      setGuestLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setGuestLoading(false);
    }
  };

  // 클럽모집 데이터 로드
  const loadRecruitClubs = async () => {
    try {
      setClubsLoading(true);
      setClubError(null);
      const params: Record<string, string> = {
        memberRecruitmentStatus: "OPEN",
        sort: "updatedAt,desc",
        size: "100",
      };
      const response = await axiosInstance.get<ClubListResponse>("/clubs", { params });
      setClubs(response.data.content ?? []);
      setClubsLoaded(true);
    } catch (e) {
      console.error(e);
      setClubError("클럽 목록을 불러오지 못했습니다.");
    } finally {
      setClubsLoading(false);
    }
  };

  // 게스트 모집: 탭 진입 시 최초 1회 로드
  useEffect(() => {
    if (activeTab === "guest" && !guestLoaded && !guestLoading) {
      void loadGuestRecruit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, guestLoaded]);

  // 게스트 모집: 서버 필터(matchType, 날짜) 변경 시 재로드
  useEffect(() => {
    if (activeTab === "guest" && guestLoaded) {
      void loadGuestRecruit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchTypeFilter, fromDate, toDate]);

  // 클럽모집: 탭 진입 시 최초 1회 로드
  useEffect(() => {
    if (activeTab === "member" && !clubsLoaded && !clubsLoading) {
      void loadRecruitClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clubsLoaded]);

  // 게스트 모집 클라이언트 필터링
  const filteredGuestItems = useMemo(() => {
    let result = guestItems;

    // 지역 필터
    if (guestRegionDepth1) {
      result = result.filter((x) => {
        const region = x.clubRegion ?? "";
        if (guestRegionDepth2) {
          return region.includes(guestRegionDepth1) && region.includes(guestRegionDepth2);
        }
        return region.includes(guestRegionDepth1);
      });
    }

    // 키워드 검색
    const k = guestKeyword.trim().toLowerCase();
    if (k) {
      result = result.filter((x) => {
        return (
          x.clubName.toLowerCase().includes(k) ||
          (x.clubRegion ?? "").toLowerCase().includes(k) ||
          x.courtName.toLowerCase().includes(k)
        );
      });
    }

    return result;
  }, [guestItems, guestKeyword, guestRegionDepth1, guestRegionDepth2]);

  // 클럽일정 포함 필터 (게스트모집 탭)
  const displayGuestItems = useMemo(() => {
    if (includeClubSchedules) return filteredGuestItems;
    const session = getOpenRunSession();
    const myClubIds = new Set((session.clubList ?? []).map((c) => c.id));
    return filteredGuestItems.filter((x) => !myClubIds.has(x.clubId));
  }, [filteredGuestItems, includeClubSchedules]);

  // 클럽모집 클라이언트 필터링
  const filteredClubs = useMemo(() => {
    let result = clubs;

    // 지역 필터
    if (clubRegionDepth1) {
      result = result.filter((club) => {
        const depth1 = club.regionDepth1 ?? "";
        const region = club.region ?? "";
        const matchDepth1 = depth1 ? depth1 === clubRegionDepth1 : region.includes(clubRegionDepth1);
        if (!matchDepth1) return false;

        if (clubRegionDepth2) {
          const depth2 = club.regionDepth2 ?? "";
          return depth2 ? depth2 === clubRegionDepth2 : region.includes(clubRegionDepth2);
        }
        return true;
      });
    }

    // 키워드 검색
    const k = clubKeyword.trim().toLowerCase();
    if (k) {
      result = result.filter((club) => {
        return (
          club.name.toLowerCase().includes(k) ||
          (club.region ?? "").toLowerCase().includes(k) ||
          (club.description ?? "").toLowerCase().includes(k)
        );
      });
    }

    return result;
  }, [clubs, clubKeyword, clubRegionDepth1, clubRegionDepth2]);

  const handleBack = () => {
    if (savedFromClubId) {
      navigate(`/clubs/${savedFromClubId}`);
      return;
    }
    navigate(-1);
  };

  const handleGuestItemClick = (item: PublicRecruitSchedule) => {
    const returnUrl = `/clubs/explore?${searchParams.toString()}`;
    navigate(`/clubs/${item.clubId}/guest-recruit/${item.scheduleId}`, { state: { returnUrl } });
  };

  const handleClubSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRecruitClubs();
  };

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {shouldShowBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </Button>
          )}
          <h1 className="text-lg font-semibold">탐색</h1>
        </div>
        {firebaseUser && (
          <Button variant="outline" size="sm" onClick={() => navigate("/clubs/new")}>
            클럽 개설
          </Button>
        )}
      </div>

      {/* 탭 + 콘텐츠 */}
      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
        <TabsList variant="line" className="w-full mb-4">
          <TabsTrigger value="guest" className="flex-1">게스트모집</TabsTrigger>
          <TabsTrigger value="member" className="flex-1">클럽모집</TabsTrigger>
        </TabsList>

        {/* 게스트모집 탭 */}
        <TabsContent value="guest">
          <div className="club-explore-page__filters">
            <div className="club-explore-page__filter-row">
              <div className="club-explore-page__filter-item club-explore-page__filter-item--search">
                <label className="club-explore-page__filter-label">클럽/코트명 검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="검색어 입력"
                    value={guestKeyword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGuestKeyword(value);
                      updateSearchParams({ guestKeyword: value || undefined });
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="club-explore-page__filter-item club-explore-page__filter-item--date">
                <label className="club-explore-page__filter-label">기간선택</label>
                <DateRangePicker
                  startDate={fromDate}
                  endDate={toDate}
                  onChange={(start, end) => {
                    setFromDate(start);
                    setToDate(end);
                    updateSearchParams({
                      fromDate: formatDateParam(start),
                      toDate: formatDateParam(end),
                    });
                  }}
                  placeholder="전체"
                />
              </div>
            </div>

            <div className="club-explore-page__filter-row">
              <div className="club-explore-page__filter-item club-explore-page__filter-item--type">
                <label className="club-explore-page__filter-label">모임타입</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={matchTypeFilter}
                  onChange={(e) => {
                    const value = e.target.value as MatchTypeFilter;
                    setMatchTypeFilter(value);
                    updateSearchParams({ matchType: value || undefined });
                  }}
                >
                  <option value="">전체</option>
                  <option value="MEN_DOUBLES">남복</option>
                  <option value="WOMEN_DOUBLES">여복</option>
                  <option value="MIXED_DOUBLES">혼복</option>
                  <option value="SINGLES">단식</option>
                </select>
              </div>

              <div className="club-explore-page__filter-item club-explore-page__filter-item--region">
                <label className="club-explore-page__filter-label">지역선택</label>
                <RegionSelector
                  depth1={guestRegionDepth1}
                  depth2={guestRegionDepth2}
                  onChangeDepth1={(value) => {
                    setGuestRegionDepth1(value);
                    setGuestRegionDepth2("");
                    updateSearchParams({ guestRegion1: value || undefined, guestRegion2: undefined });
                  }}
                  onChangeDepth2={(value) => {
                    setGuestRegionDepth2(value);
                    if (value) {
                      updateSearchParams({ guestRegion2: value });
                    }
                  }}
                  showAllOption
                />
              </div>
            </div>

            {/* 클럽일정 포함 토글 */}
            <div className="flex items-center gap-2 mt-3">
              <Switch
                id="include-club"
                checked={includeClubSchedules}
                onCheckedChange={(checked) => {
                  setIncludeClubSchedules(checked);
                  updateSearchParams({ includeClub: checked ? undefined : "false" });
                }}
              />
              <Label htmlFor="include-club" className="text-sm text-muted-foreground cursor-pointer">
                클럽일정 포함
              </Label>
            </div>
          </div>

          {/* 게스트모집 리스트 */}
          <div className="mt-4">
            {guestLoading || !guestLoaded ? (
              <CardSkeleton />
            ) : displayGuestItems.length === 0 ? (
              <EmptyState
                icon={CalendarSearch}
                title="모집 중인 일정이 없습니다"
                description="검색 조건을 변경해 보세요"
              />
            ) : (
              <div className="space-y-3">
                {displayGuestItems.map((x) => (
                  <ScheduleCard
                    key={`G:${x.scheduleId}`}
                    schedule={{
                      ...x,
                      clubRegion: x.clubRegion ?? "",
                      matchType: x.matchType ?? "NONE",
                      durationMinutes: x.durationMinutes ?? 120,
                      cost: x.cost ?? 0,
                      note: x.note ?? null,
                    }}
                    onClick={() => handleGuestItemClick(x)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 클럽모집 탭 */}
        <TabsContent value="member">
          <div className="club-explore-page__filters">
            <div className="club-explore-page__filter-row">
              <div className="club-explore-page__filter-item club-explore-page__filter-item--search">
                <label className="club-explore-page__filter-label">클럽명 검색</label>
                <form onSubmit={handleClubSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="검색어 입력"
                    value={clubKeyword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClubKeyword(value);
                      updateSearchParams({ clubKeyword: value || undefined });
                    }}
                    className="pl-9"
                  />
                </form>
              </div>

              <div className="club-explore-page__filter-item club-explore-page__filter-item--region">
                <label className="club-explore-page__filter-label">지역선택</label>
                <RegionSelector
                  depth1={clubRegionDepth1}
                  depth2={clubRegionDepth2}
                  onChangeDepth1={(value) => {
                    setClubRegionDepth1(value);
                    setClubRegionDepth2("");
                    updateSearchParams({ clubRegion1: value || undefined, clubRegion2: undefined });
                  }}
                  onChangeDepth2={(value) => {
                    setClubRegionDepth2(value);
                    if (value) {
                      updateSearchParams({ clubRegion2: value });
                    }
                  }}
                  showAllOption
                />
              </div>
            </div>
          </div>

          {/* 클럽모집 리스트 */}
          <div className="mt-4">
            {clubsLoading || !clubsLoaded ? (
              <CardSkeleton />
            ) : clubError ? (
              <EmptyState
                icon={Users}
                title="오류가 발생했습니다"
                description={clubError}
              />
            ) : filteredClubs.length === 0 ? (
              <EmptyState
                icon={Users}
                title="모집 중인 클럽이 없습니다"
                description="다른 검색 조건을 시도해 보세요"
              />
            ) : (
              <div className="space-y-3">
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onClick={() => {
                      const returnUrl = `/clubs/explore?${searchParams.toString()}`;
                      navigate(`/clubs/${club.id}/recruiting`, { state: { returnUrl } });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubExplorePage;
