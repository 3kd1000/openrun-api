import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import type { Club } from "../../types/club";
import { ArrowLeftIcon, SearchIcon, MapPinIcon } from "../../components/common/Icons";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import "./RecruitClubsPage.css";

interface ClubListResponse {
  content: Club[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const RecruitClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const regions = useMemo(
    () => ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"],
    []
  );

  useEffect(() => {
    void fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionFilter]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = { memberRecruitmentStatus: "OPEN" };
      if (regionFilter) params.region = regionFilter;
      if (searchKeyword) params.keyword = searchKeyword;
      params.size = "30";
      const response = await axiosInstance.get<ClubListResponse>("/clubs", { params });
      setClubs(response.data.content ?? []);
    } catch (e) {
      logError("신규회원 모집 클럽 목록 조회", e);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchClubs();
  };

  return (
    <div className="recruit-clubs-page">
      <div className="recruit-clubs-page__header">
        <button className="recruit-clubs-page__back-btn" onClick={() => navigate("/clubs/explore")}>
          <ArrowLeftIcon size={20} />
        </button>
        <h1 className="recruit-clubs-page__title">신규회원 모집 중</h1>
        <div className="recruit-clubs-page__header-spacer" />
      </div>

      <div className="recruit-clubs-page__filters">
        <form className="recruit-clubs-page__search" onSubmit={handleSearch}>
          <SearchIcon size={18} className="recruit-clubs-page__search-icon" />
          <input
            type="text"
            className="recruit-clubs-page__search-input"
            placeholder="클럽 이름으로 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </form>
        <div className="recruit-clubs-page__region-filter">
          <MapPinIcon size={16} />
          <select
            className="recruit-clubs-page__region-select"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">전체 지역</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="recruit-clubs-page__content">
        {loading ? (
          <div className="recruit-clubs-page__loading">불러오는 중...</div>
        ) : error ? (
          <div className="recruit-clubs-page__error">{error}</div>
        ) : clubs.length === 0 ? (
          <div className="recruit-clubs-page__empty">모집 중인 클럽이 없습니다.</div>
        ) : (
          <div className="recruit-clubs-page__list">
            {clubs.map((club) => (
              <button
                key={club.id}
                className="recruit-clubs-page__item"
                type="button"
                onClick={() => navigate(`/clubs/${club.id}/detail`)}
              >
                <div className="recruit-clubs-page__item-icon">🎾</div>
                <div className="recruit-clubs-page__item-info">
                  <div className="recruit-clubs-page__item-name">{club.name}</div>
                  {club.region ? <div className="recruit-clubs-page__item-meta">{club.region}</div> : null}
                  {club.description ? <div className="recruit-clubs-page__item-meta">{club.description}</div> : null}
                </div>
                <div className="recruit-clubs-page__item-cta">자세히보기</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitClubsPage;

