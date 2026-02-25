import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { useAuth } from "../../../contexts/AuthContext";
import RegionSelector from "../../../components/common/RegionSelector";
import DateRangePicker from "../../../components/common/DateRangePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ScheduleCard from "@/components/openrun/schedule-card";
import ClubCard from "@/components/openrun/club-card";
import EmptyState from "@/components/openrun/empty-state";
import { Search, CalendarSearch, Users, Plus } from "lucide-react";
import type { PublicScheduleResponse } from "../../../types/schedule";
import { scheduleService } from "../../../services/scheduleService";
import BackButton from "../../../components/common/BackButton";
import { AppHeader } from "../../../components/common/AppHeader";
import { ClubSelector } from "../../../components/ClubSelector";
import { useClubSelectorState } from "../../../hooks/useClubSelectorState";

type TabType = "schedule" | "club";
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
  recruitType: "GUEST" | "INTERCLUB";
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

// 탭 초기값 결정 (이전 URL 파라미터 호환)
const resolveInitialTab = (tabParam: string | null, stateTab?: string): TabType => {
  if (tabParam === "club" || tabParam === "member") return "club";
  if (tabParam === "schedule" || tabParam === "guest" || tabParam === "open") return "schedule";
  if (stateTab === "member" || stateTab === "club") return "club";
  return "schedule";
};

const ClubExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: firebaseUser } = useAuth();
  const {
    clubs: selectorClubs,
    selectedClubId,
    isLoading: clubSelectorLoading,
    handleClubChange,
    isLoggedIn,
  } = useClubSelectorState();

  const initialTab = useMemo(() => {
    const tabFromUrl = searchParams.get("tab");
    const state = location.state as { defaultTab?: string } | null;
    return resolveInitialTab(tabFromUrl, state?.defaultTab);
  }, [searchParams, location.state]);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 모임 탐색 상태 - URL에서 초기값 읽기
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

  // 공개일정 상태
  const [publicSchedules, setPublicSchedules] = useState<PublicScheduleResponse[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicLoaded, setPublicLoaded] = useState(false);

  // 클럽 탐색 상태 - URL에서 초기값 읽기
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

  // URL 파라미터 업데이트 헬퍼
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

  // 공개일정 로드
  const loadPublicSchedules = async () => {
    try {
      setPublicLoading(true);
      const data = await scheduleService.getPublicSchedules(
        guestRegionDepth1 && guestRegionDepth2
          ? `${guestRegionDepth1} ${guestRegionDepth2}`
          : guestRegionDepth1 || undefined,
        matchTypeFilter || undefined,
        50
      );
      setPublicSchedules(data);
      setPublicLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setPublicLoading(false);
    }
  };

  // 클럽 탐색 데이터 로드
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

  // 모임 탐색: 탭 진입 시 최초 1회 로드 (게스트 모집 + 공개일정)
  useEffect(() => {
    if (activeTab === "schedule") {
      if (!guestLoaded && !guestLoading) void loadGuestRecruit();
      if (!publicLoaded && !publicLoading) void loadPublicSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, guestLoaded, publicLoaded]);

  // 모임 탐색: 서버 필터(matchType, 날짜) 변경 시 재로드
  useEffect(() => {
    if (activeTab === "schedule" && guestLoaded) {
      void loadGuestRecruit();
      void loadPublicSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchTypeFilter, fromDate, toDate]);

  // 클럽 탐색: 탭 진입 시 최초 1회 로드
  useEffect(() => {
    if (activeTab === "club" && !clubsLoaded && !clubsLoading) {
      void loadRecruitClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clubsLoaded]);

  // 게스트 모집 클라이언트 필터링
  const filteredGuestItems = useMemo(() => {
    let result = guestItems;

    if (guestRegionDepth1) {
      result = result.filter((x) => {
        const region = x.clubRegion ?? "";
        if (guestRegionDepth2) {
          return region.includes(guestRegionDepth1) && region.includes(guestRegionDepth2);
        }
        return region.includes(guestRegionDepth1);
      });
    }

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

  // 공개일정 클라이언트 필터링 (키워드, 지역)
  const filteredPublicSchedules = useMemo(() => {
    let result = publicSchedules;

    if (guestRegionDepth1) {
      result = result.filter((s) => {
        const region = s.region ?? "";
        if (guestRegionDepth2) {
          return region.includes(guestRegionDepth1) && region.includes(guestRegionDepth2);
        }
        return region.includes(guestRegionDepth1);
      });
    }

    const k = guestKeyword.trim().toLowerCase();
    if (k) {
      result = result.filter((s) => {
        return (
          s.courtName.toLowerCase().includes(k) ||
          (s.region ?? "").toLowerCase().includes(k) ||
          (s.courtAddress ?? "").toLowerCase().includes(k) ||
          s.hostDisplayName.toLowerCase().includes(k)
        );
      });
    }

    return result;
  }, [publicSchedules, guestKeyword, guestRegionDepth1, guestRegionDepth2]);

  // 통합 리스트: 게스트모집 + 공개일정 날짜순 정렬
  type DisplayItem =
    | { type: "club"; key: string; scheduledAt: string; data: PublicRecruitSchedule }
    | { type: "public"; key: string; scheduledAt: string; data: PublicScheduleResponse };

  const mergedScheduleItems = useMemo<DisplayItem[]>(() => {
    const clubItems: DisplayItem[] = filteredGuestItems.map((x) => ({
      type: "club" as const,
      key: `club:${x.scheduleId}`,
      scheduledAt: x.scheduledAt,
      data: x,
    }));
    const pubItems: DisplayItem[] = filteredPublicSchedules.map((s) => ({
      type: "public" as const,
      key: `pub:${s.id}`,
      scheduledAt: s.scheduledAt,
      data: s,
    }));
    return [...clubItems, ...pubItems].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [filteredGuestItems, filteredPublicSchedules]);

  // 클럽 탐색 클라이언트 필터링
  const filteredClubs = useMemo(() => {
    let result = clubs;

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
    const returnUrl = `/explore?${searchParams.toString()}`;
    navigate(`/schedules/${item.scheduleId}/recruit`, { state: { returnUrl } });
  };

  const handleClubSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRecruitClubs();
  };

  const isScheduleLoading = (guestLoading || !guestLoaded) && (publicLoading || !publicLoaded);

  return (
    <>
      {/* 통일 헤더 */}
      <div className="shrink-0 sticky top-0 z-[100]">
        <AppHeader>
          {isLoggedIn && (
            <ClubSelector
              selectedClubId={selectedClubId}
              onClubChange={handleClubChange}
              clubs={selectorClubs}
              isLoading={clubSelectorLoading}
            />
          )}
        </AppHeader>
      </div>

    <div className="page-container">
      {/* 뒤로가기 */}
      {shouldShowBack && (
        <div className="mb-3">
          <BackButton onClick={handleBack} />
        </div>
      )}

      {/* 탭 + 콘텐츠 */}
      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
        <TabsList variant="line" className="w-full mb-4">
          <TabsTrigger value="schedule" className="flex-1">모임 탐색</TabsTrigger>
          <TabsTrigger value="club" className="flex-1">클럽 탐색</TabsTrigger>
        </TabsList>

        {/* 모임 탐색 탭 */}
        <TabsContent value="schedule">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">클럽/코트명 검색</label>
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

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">기간선택</label>
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

            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">모임타입</label>
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

              <div className="flex flex-col gap-1 flex-[2] min-w-0">
                <label className="text-xs font-medium text-muted-foreground">지역선택</label>
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

          </div>

          {/* 통합 리스트 */}
          <div className="mt-4">
            {isScheduleLoading ? (
              <CardSkeleton />
            ) : mergedScheduleItems.length === 0 && !firebaseUser ? (
              <EmptyState
                icon={CalendarSearch}
                title="모집 중인 일정이 없습니다"
                description="검색 조건을 변경해보세요"
              />
            ) : (
              <div className="space-y-3">
                {/* 새 일정 만들기 카드 */}
                {firebaseUser && (
                  <Card
                    className="cursor-pointer gap-0 py-0 border-primary/30 border-dashed transition-all hover:shadow-md hover:border-primary"
                    onClick={() => navigate("/schedules/public/new")}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-primary">새 일정 만들기</span>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-0">직접 모임을 만들고 참가자를 모집해보세요</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {mergedScheduleItems.map((item) =>
                  item.type === "club" ? (
                    <ScheduleCard
                      key={item.key}
                      schedule={{
                        ...item.data,
                        clubRegion: item.data.clubRegion ?? "",
                        matchType: item.data.matchType ?? "NONE",
                        durationMinutes: item.data.durationMinutes ?? 120,
                        cost: item.data.cost ?? 0,
                        note: item.data.note ?? null,
                      }}
                      onClick={() => handleGuestItemClick(item.data)}
                    />
                  ) : (
                    <ScheduleCard
                      key={item.key}
                      schedule={{
                        scheduleId: item.data.id,
                        clubId: null,
                        clubName: `${item.data.hostDisplayName}`,
                        clubRegion: item.data.region ?? "",
                        recruitType: "GUEST",
                        matchType: item.data.matchType ?? "NONE",
                        scheduledAt: item.data.scheduledAt,
                        durationMinutes: item.data.durationMinutes ?? 120,
                        courtName: item.data.courtName,
                        currentParticipants: item.data.currentParticipants,
                        maxCapacity: item.data.maxCapacity,
                        cost: item.data.cost ?? 0,
                        note: item.data.courtAddress ?? null,
                      }}
                      onClick={() => {
                        const returnUrl = `/explore?${searchParams.toString()}`;
                        navigate(`/schedules/${item.data.id}/recruit`, { state: { returnUrl } });
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 클럽 탐색 탭 */}
        <TabsContent value="club">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground">클럽명 검색</label>
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

              <div className="flex flex-col gap-1 flex-[2] min-w-0">
                <label className="text-xs font-medium text-muted-foreground">지역선택</label>
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

          {/* 클럽 탐색 리스트 */}
          <div className="mt-4">
            {clubsLoading || !clubsLoaded ? (
              <CardSkeleton />
            ) : clubError ? (
              <EmptyState
                icon={Users}
                title="오류가 발생했습니다"
                description={clubError}
              />
            ) : filteredClubs.length === 0 && !firebaseUser ? (
              <EmptyState
                icon={Users}
                title="모집 중인 클럽이 없습니다"
                description="다른 검색 조건을 시도해 보세요"
              />
            ) : (
              <div className="space-y-3">
                {/* 새 클럽 만들기 카드 */}
                {firebaseUser && (
                  <Card
                    className="cursor-pointer gap-0 py-0 border-primary/30 border-dashed transition-all hover:shadow-md hover:border-primary"
                    onClick={() => navigate("/clubs/new")}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-primary">새 클럽 만들기</span>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-0">나만의 테니스 클럽을 만들어보세요</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onClick={() => {
                      const returnUrl = `/explore?${searchParams.toString()}`;
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
    </>
  );
};

export default ClubExplorePage;
