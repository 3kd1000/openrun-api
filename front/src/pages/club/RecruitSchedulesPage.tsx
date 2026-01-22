import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import { ArrowLeftIcon, SearchIcon } from "../../components/common/Icons";
import RegionSelector from "../../components/common/RegionSelector";
import DateRangePicker from "../../components/common/DateRangePicker";
import "./RecruitSchedulesPage.css";

type RecruitType = "GUEST" | "INTERCLUB";
type MatchTypeFilter = "" | "MEN_DOUBLES" | "WOMEN_DOUBLES" | "MIXED_DOUBLES";

interface PublicRecruitSchedule {
  scheduleId: number;
  clubId: number;
  clubName: string;
  clubRegion?: string | null;
  recruitType: RecruitType;
  matchType?: string | null;
  scheduledAt: string;
  courtName: string;
  currentParticipants: number;
  maxCapacity: number;
  cost?: number | null;
  note?: string | null;
}

const RecruitSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = (params.get("type")?.toUpperCase() === "INTERCLUB" ? "INTERCLUB" : "GUEST") as RecruitType;

  const [items, setItems] = useState<PublicRecruitSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>("");
  const [regionDepth1, setRegionDepth1] = useState("");
  const [regionDepth2, setRegionDepth2] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, matchTypeFilter, fromDate, toDate]);

  const formatDateForApi = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<PublicRecruitSchedule[]>("/schedules/recruit", {
        params: {
          type,
          matchType: matchTypeFilter || undefined,
          fromDate: formatDateForApi(fromDate),
          toDate: formatDateForApi(toDate),
          limit: 50
        },
      });
      setItems(res.data);
    } catch (e) {
      console.error(e);
      alert("모집 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeLabel = (matchType: string | null | undefined): string => {
    switch (matchType) {
      case "MEN_DOUBLES": return "남복";
      case "WOMEN_DOUBLES": return "여복";
      case "MIXED_DOUBLES": return "혼복";
      default: return "";
    }
  };

  const filtered = useMemo(() => {
    let result = items;

    // 지역 필터
    if (regionDepth1) {
      result = result.filter((x) => {
        const region = x.clubRegion ?? "";
        if (regionDepth2) {
          return region.includes(regionDepth1) && region.includes(regionDepth2);
        }
        return region.includes(regionDepth1);
      });
    }

    // 키워드 검색
    const k = keyword.trim().toLowerCase();
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
  }, [items, keyword, regionDepth1, regionDepth2]);

  const title = type === "GUEST" ? "게스트 모집" : "교류전 모집";

  const handleOpen = (item: PublicRecruitSchedule) => {
    if (item.recruitType === "GUEST") {
      navigate(`/clubs/${item.clubId}/guest-recruit/${item.scheduleId}`);
      return;
    }
    navigate(`/clubs/${item.clubId}/interclub-recruit/${item.scheduleId}`);
  };

  return (
    <div className="recruit-schedules-page">
      <div className="recruit-schedules-page__header">
        <button className="recruit-schedules-page__back-btn" onClick={() => navigate(-1)}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="recruit-schedules-page__title">{title} 전체보기</h1>
        <div className="recruit-schedules-page__header-spacer" />
      </div>

      <div className="recruit-schedules-page__filters">
        <div className="recruit-schedules-page__filter-item">
          <label className="recruit-schedules-page__filter-label">클럽/코트명 검색</label>
          <div className="recruit-schedules-page__search">
            <SearchIcon size={18} className="recruit-schedules-page__search-icon" />
            <input
              className="recruit-schedules-page__search-input"
              placeholder="검색어 입력"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        <div className="recruit-schedules-page__filter-row">
          <div className="recruit-schedules-page__filter-item recruit-schedules-page__filter-item--half">
            <label className="recruit-schedules-page__filter-label">모임타입</label>
            <select
              className="recruit-schedules-page__filter-select"
              value={matchTypeFilter}
              onChange={(e) => setMatchTypeFilter(e.target.value as MatchTypeFilter)}
            >
              <option value="">전체</option>
              <option value="MEN_DOUBLES">남복</option>
              <option value="WOMEN_DOUBLES">여복</option>
              <option value="MIXED_DOUBLES">혼복</option>
            </select>
          </div>

          <div className="recruit-schedules-page__filter-item recruit-schedules-page__filter-item--half">
            <label className="recruit-schedules-page__filter-label">기간선택</label>
            <DateRangePicker
              startDate={fromDate}
              endDate={toDate}
              onChange={(start, end) => {
                setFromDate(start);
                setToDate(end);
              }}
              placeholder="전체"
            />
          </div>
        </div>

        <div className="recruit-schedules-page__filter-item">
          <label className="recruit-schedules-page__filter-label">지역선택</label>
          <RegionSelector
            depth1={regionDepth1}
            depth2={regionDepth2}
            onChangeDepth1={setRegionDepth1}
            onChangeDepth2={setRegionDepth2}
            showAllOption
          />
        </div>
      </div>

      {loading ? (
        <div className="recruit-schedules-page__loading">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="recruit-schedules-page__empty">모집 중인 일정이 없습니다.</div>
      ) : (
        <div className="recruit-schedules-page__list">
          {filtered.map((x) => (
            <button
              key={`${x.recruitType}:${x.scheduleId}`}
              className="recruit-schedules-page__item"
              onClick={() => handleOpen(x)}
              type="button"
            >
              <div className="recruit-schedules-page__item-top">
                <div className="recruit-schedules-page__club">
                  {x.clubName}
                  {getMatchTypeLabel(x.matchType) && (
                    <span className={`recruit-schedules-page__match-type match-type--${x.matchType?.toLowerCase()}`}>
                      {getMatchTypeLabel(x.matchType)}
                    </span>
                  )}
                </div>
                <div className="recruit-schedules-page__meta">
                  {x.clubRegion ? x.clubRegion : ""}
                </div>
              </div>
              <div className="recruit-schedules-page__meta">
                {new Date(x.scheduledAt).toLocaleString()} · {x.courtName}
              </div>
              <div className="recruit-schedules-page__meta">
                {x.currentParticipants}/{x.maxCapacity} · 비용 {x.cost ?? "-"}
              </div>
              {x.note ? (
                <div className="recruit-schedules-page__note">{x.note}</div>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruitSchedulesPage;

