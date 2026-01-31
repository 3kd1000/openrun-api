import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../services/api/axiosInstance";
import type { Club } from "../../../types/club";
import { formatScheduleDateTime } from "../../../utils/dateUtils";
import {
  ArrowLeftIcon,
  PlusIcon,
  SearchIcon,
} from "../../../components/common/Icons";
import { useAuth } from "../../../contexts/AuthContext";
import RegionSelector from "../../../components/common/RegionSelector";
import DateRangePicker from "../../../components/common/DateRangePicker";
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

const getMatchTypeLabel = (matchType: string | null | undefined): string => {
  switch (matchType) {
    case "MEN_DOUBLES": return "남복";
    case "WOMEN_DOUBLES": return "여복";
    case "MIXED_DOUBLES": return "혼복";
    case "SINGLES": return "단식";
    default: return "";
  }
};

const formatDateForApi = formatDateParam;

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

  // 신규회원 모집 상태 - URL에서 초기값 읽기
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubsLoaded, setClubsLoaded] = useState(false);
  const [clubKeyword, setClubKeyword] = useState(() => searchParams.get("clubKeyword") || "");
  const [clubRegionDepth1, setClubRegionDepth1] = useState(() => searchParams.get("clubRegion1") || "");
  const [clubRegionDepth2, setClubRegionDepth2] = useState(() => searchParams.get("clubRegion2") || "");
  const [clubError, setClubError] = useState<string | null>(null);

  // 초기 마운트 시 fromClubId를 저장 (탭 변경으로 location.state가 사라져도 유지)
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

  // 탭 변경 시 URL 업데이트 (다른 파라미터 유지)
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

  // 신규회원 모집 데이터 로드 (지역은 클라이언트에서 필터링)
  const loadRecruitClubs = async () => {
    try {
      setClubsLoading(true);
      setClubError(null);
      const params: Record<string, string> = {
        memberRecruitmentStatus: "OPEN",
        sort: "updatedAt,desc",
        size: "100", // 클라이언트 필터링을 위해 충분히 가져옴
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

  // 신규회원 모집: 탭 진입 시 최초 1회 로드
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

  // 신규회원 모집 클라이언트 필터링
  const filteredClubs = useMemo(() => {
    let result = clubs;

    // 지역 필터 (regionDepth1/regionDepth2 또는 region 필드 사용)
    if (clubRegionDepth1) {
      result = result.filter((club) => {
        const depth1 = club.regionDepth1 ?? "";
        const region = club.region ?? "";
        // regionDepth1 필드가 있으면 정확히 매칭, 없으면 region 필드에서 포함 여부 확인
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
    // 현재 URL (검색조건 포함)을 returnUrl로 전달
    const returnUrl = `/clubs/explore?${searchParams.toString()}`;
    navigate(`/clubs/${item.clubId}/guest-recruit/${item.scheduleId}`, { state: { returnUrl } });
  };

  const handleClubSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRecruitClubs();
  };

  return (
    <div className="club-explore-page">
      {/* 헤더 */}
      <div className="club-explore-page__header">
        {shouldShowBack ? (
          <button className="club-explore-page__back-btn" onClick={handleBack}>
            <ArrowLeftIcon size={20} />
          </button>
        ) : (
          <div className="club-explore-page__header-spacer" />
        )}
        <h1 className="club-explore-page__title">클럽 탐색</h1>
        <button
          className="club-explore-page__create-btn"
          onClick={() => navigate("/clubs/new")}
          title="클럽개설"
        >
          <PlusIcon size={18} />
          클럽개설
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="club-explore-page__tabs">
        <button
          className={`club-explore-page__tab ${activeTab === "guest" ? "club-explore-page__tab--active" : ""}`}
          onClick={() => handleTabChange("guest")}
        >
          게스트 모집
        </button>
        <button
          className={`club-explore-page__tab ${activeTab === "member" ? "club-explore-page__tab--active" : ""}`}
          onClick={() => handleTabChange("member")}
        >
          신규회원 모집
        </button>
      </div>

      {/* 게스트 모집 탭 */}
      {activeTab === "guest" && (
        <div className="club-explore-page__tab-content">
          <div className="club-explore-page__filters">
            <div className="club-explore-page__filter-row">
              <div className="club-explore-page__filter-item club-explore-page__filter-item--search">
                <label className="club-explore-page__filter-label">클럽/코트명 검색</label>
                <div className="club-explore-page__search">
                  <SearchIcon size={18} className="club-explore-page__search-icon" />
                  <input
                    className="club-explore-page__search-input"
                    placeholder="검색어 입력"
                    value={guestKeyword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGuestKeyword(value);
                      updateSearchParams({ guestKeyword: value || undefined });
                    }}
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
                  className="club-explore-page__filter-select"
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
                    // depth1 변경 시 RegionSelector가 내부적으로 onChangeDepth2("")를 호출하므로
                    // 빈값일 때는 URL 업데이트 생략 (depth1 핸들러에서 이미 처리됨)
                    if (value) {
                      updateSearchParams({ guestRegion2: value });
                    }
                  }}
                  showAllOption
                />
              </div>
            </div>
          </div>

          {guestLoading || !guestLoaded ? (
            <div className="club-explore-page__loading">로딩 중...</div>
          ) : filteredGuestItems.length === 0 ? (
            <div className="club-explore-page__empty">모집 중인 일정이 없습니다.</div>
          ) : (
            <div className="club-explore-page__list">
              {filteredGuestItems.map((x) => (
                <button
                  key={`G:${x.scheduleId}`}
                  className="club-explore-page__list-item"
                  onClick={() => handleGuestItemClick(x)}
                  type="button"
                >
                  <div className="club-explore-page__list-item-top">
                    <div className="club-explore-page__list-item-title">
                      {x.clubName}
                      {getMatchTypeLabel(x.matchType) && (
                        <span className={`club-explore-page__match-type-badge match-type--${x.matchType?.toLowerCase()}`}>
                          {getMatchTypeLabel(x.matchType)}
                        </span>
                      )}
                    </div>
                    <div className="club-explore-page__list-item-meta">
                      {x.clubRegion ? x.clubRegion : ""}
                    </div>
                  </div>
                  <div className="club-explore-page__list-item-meta">
                    {formatScheduleDateTime(x.scheduledAt, x.durationMinutes)} · {x.courtName}
                  </div>
                  <div className="club-explore-page__list-item-meta">
                    {x.currentParticipants}/{x.maxCapacity} · 비용 {x.cost ?? "-"}
                  </div>
                  {x.note ? (
                    <div className="club-explore-page__list-item-note">{x.note}</div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 신규회원 모집 탭 */}
      {activeTab === "member" && (
        <div className="club-explore-page__tab-content">
          <div className="club-explore-page__filters">
            <div className="club-explore-page__filter-row">
              <div className="club-explore-page__filter-item club-explore-page__filter-item--search">
                <label className="club-explore-page__filter-label">클럽명 검색</label>
                <form className="club-explore-page__search" onSubmit={handleClubSearch}>
                  <SearchIcon size={18} className="club-explore-page__search-icon" />
                  <input
                    type="text"
                    className="club-explore-page__search-input"
                    placeholder="검색어 입력"
                    value={clubKeyword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClubKeyword(value);
                      updateSearchParams({ clubKeyword: value || undefined });
                    }}
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
                    // depth1 변경 시 RegionSelector가 내부적으로 onChangeDepth2("")를 호출하므로
                    // 빈값일 때는 URL 업데이트 생략 (depth1 핸들러에서 이미 처리됨)
                    if (value) {
                      updateSearchParams({ clubRegion2: value });
                    }
                  }}
                  showAllOption
                />
              </div>
            </div>
          </div>

          {clubsLoading || !clubsLoaded ? (
            <div className="club-explore-page__loading">불러오는 중...</div>
          ) : clubError ? (
            <div className="club-explore-page__error">{clubError}</div>
          ) : filteredClubs.length === 0 ? (
            <div className="club-explore-page__empty">모집 중인 클럽이 없습니다.</div>
          ) : (
            <div className="club-explore-page__club-list">
              {filteredClubs.map((club) => (
                <button
                  key={club.id}
                  className="club-explore-page__club-item"
                  type="button"
                  onClick={() => {
                    // 현재 URL (검색조건 포함)을 returnUrl로 전달
                    const returnUrl = `/clubs/explore?${searchParams.toString()}`;
                    navigate(`/clubs/${club.id}/recruiting`, { state: { returnUrl } });
                  }}
                >
                  <div className="club-explore-page__club-item-info">
                    <div className="club-explore-page__club-item-header">
                      <span className="club-explore-page__club-item-name">{club.name}</span>
                      <span className={`club-explore-page__club-item-badge ${club.joinPolicy === "AUTO" ? "club-explore-page__club-item-badge--auto" : ""}`}>
                        {club.joinPolicy === "AUTO" ? "바로가입" : "승인제"}
                      </span>
                    </div>
                    <div className="club-explore-page__club-item-details">
                      {club.region && <span>{club.region}</span>}
                      {club.memberCount !== undefined && <span>회원 {club.memberCount}명</span>}
                    </div>
                    {club.description && (
                      <div className="club-explore-page__club-item-desc">{club.description}</div>
                    )}
                  </div>
                  <div className="club-explore-page__club-item-cta">자세히보기</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClubExplorePage;
