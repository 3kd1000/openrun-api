import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import { ArrowLeftIcon, SearchIcon } from "../../components/common/Icons";
import "./RecruitSchedulesPage.css";

type RecruitType = "GUEST" | "INTERCLUB";

interface PublicRecruitSchedule {
  scheduleId: number;
  clubId: number;
  clubName: string;
  clubRegion?: string | null;
  recruitType: RecruitType;
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

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<PublicRecruitSchedule[]>("/schedules/recruit", {
        params: { type, limit: 50 },
      });
      setItems(res.data);
    } catch (e) {
      console.error(e);
      alert("모집 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return items;
    return items.filter((x) => {
      return (
        x.clubName.toLowerCase().includes(k) ||
        (x.clubRegion ?? "").toLowerCase().includes(k) ||
        x.courtName.toLowerCase().includes(k)
      );
    });
  }, [items, keyword]);

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

      <div className="recruit-schedules-page__search">
        <SearchIcon size={18} className="recruit-schedules-page__search-icon" />
        <input
          className="recruit-schedules-page__search-input"
          placeholder="클럽/지역/코트명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
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
                <div className="recruit-schedules-page__club">{x.clubName}</div>
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

