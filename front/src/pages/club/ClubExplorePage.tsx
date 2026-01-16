import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/api/axiosInstance";
import type { Club } from "../../types/club";
import { isNotEmpty } from "../../utils/isEmpty";
import {
  ArrowLeftIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../components/common/Icons";
import { useAuth } from "../../contexts/AuthContext";
import {
  getOpenRunUiSettings,
  setOpenRunUiSettings,
} from "../../utils/openrunUiSettings";
import "./ClubExplorePage.css";

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

interface ClubListResponse {
  content: Club[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const ClubExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: firebaseUser } = useAuth();
  const [guestRecruit, setGuestRecruit] = useState<PublicRecruitSchedule[]>([]);
  const [interclubRecruit, setInterclubRecruit] = useState<
    PublicRecruitSchedule[]
  >([]);
  const [recruitClubs, setRecruitClubs] = useState<Club[]>([]);

  const [guestExpanded, setGuestExpanded] = useState(true);
  const [interclubExpanded, setInterclubExpanded] = useState(true);
  const [membersExpanded, setMembersExpanded] = useState(true);

  const fromClubId = useMemo(() => {
    const state = location.state as { fromClubId?: string | number } | null;
    const raw = state?.fromClubId;
    if (raw === null || raw === undefined) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? String(n) : null;
  }, [location.state]);

  const shouldShowBack = Boolean(firebaseUser && fromClubId);

  useEffect(() => {
    // 탐색 상단 섹션: 모집 중 일정들
    void fetchRecruit("GUEST");
    void fetchRecruit("INTERCLUB");
    void fetchRecruitClubs();
    // 접기/펼치기 상태 로드
    try {
      const expanded = getOpenRunUiSettings().clubExploreExpanded;
      if (expanded && typeof expanded.guestExpanded === "boolean")
        setGuestExpanded(expanded.guestExpanded);
      if (expanded && typeof expanded.interclubExpanded === "boolean")
        setInterclubExpanded(expanded.interclubExpanded);
      if (expanded && typeof expanded.membersExpanded === "boolean")
        setMembersExpanded(expanded.membersExpanded);
    } catch {
      // ignore
    }
  }, []);

  const persistExpand = (
    next: Partial<{
      guestExpanded: boolean;
      interclubExpanded: boolean;
      membersExpanded: boolean;
    }>
  ) => {
    try {
      const prev = getOpenRunUiSettings().clubExploreExpanded ?? {};
      const merged = { ...prev, ...next };
      setOpenRunUiSettings({ clubExploreExpanded: merged });
    } catch {
      // ignore
    }
  };

  const fetchRecruit = async (type: RecruitType) => {
    try {
      const response = await axiosInstance.get<PublicRecruitSchedule[]>(
        "/schedules/recruit",
        {
          params: { type, limit: 5 },
        }
      );
      if (type === "GUEST") setGuestRecruit(response.data);
      else setInterclubRecruit(response.data);
    } catch {
      // 탐색에서 실패는 치명적이지 않으므로 무시
    }
  };

  const fetchRecruitClubs = async () => {
    try {
      const response = await axiosInstance.get<ClubListResponse>("/clubs", {
        params: { memberRecruitmentStatus: "OPEN", size: 5 },
      });
      setRecruitClubs(response.data.content ?? []);
    } catch {
      setRecruitClubs([]);
    }
  };

  const toggleGuest = () => {
    setGuestExpanded((v) => {
      const next = !v;
      persistExpand({ guestExpanded: next });
      return next;
    });
  };

  const toggleInterclub = () => {
    setInterclubExpanded((v) => {
      const next = !v;
      persistExpand({ interclubExpanded: next });
      return next;
    });
  };

  const toggleMembers = () => {
    setMembersExpanded((v) => {
      const next = !v;
      persistExpand({ membersExpanded: next });
      return next;
    });
  };

  const handleBack = () => {
    if (fromClubId) {
      navigate(`/clubs/${fromClubId}`);
      return;
    }
    navigate(-1);
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

      {/* 모집 중 섹션 (탐색 상단) */}
      <div className="club-explore-page__recruit-sections">
        <div className="club-explore-page__recruit-section">
          <div className="club-explore-page__recruit-header">
            <button
              className="club-explore-page__recruit-title-btn"
              type="button"
              onClick={toggleGuest}
            >
              {guestExpanded ? (
                <ChevronUpIcon size={18} />
              ) : (
                <ChevronDownIcon size={18} />
              )}
              <span className="club-explore-page__recruit-title">
                게스트 모집 중
              </span>
            </button>
            <button
              className="club-explore-page__recruit-more"
              onClick={() => navigate("/clubs/explore/recruit?type=GUEST")}
            >
              전체보기
            </button>
          </div>
          {!guestExpanded ? null : guestRecruit.length === 0 ? (
            <div className="club-explore-page__recruit-empty">
              모집 중인 일정이 없습니다.
            </div>
          ) : (
            <div className="club-explore-page__recruit-list">
              {guestRecruit.map((x) => (
                <button
                  key={`G:${x.scheduleId}`}
                  className="club-explore-page__recruit-item"
                  onClick={() =>
                    navigate(`/clubs/${x.clubId}/guest-recruit/${x.scheduleId}`)
                  }
                >
                  <div className="club-explore-page__recruit-item-title">
                    {x.clubName}
                  </div>
                  <div className="club-explore-page__recruit-item-meta">
                    {new Date(x.scheduledAt).toLocaleString()} · {x.courtName}
                  </div>
                  <div className="club-explore-page__recruit-item-meta">
                    {x.currentParticipants}/{x.maxCapacity} · 비용{" "}
                    {x.cost ?? "-"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="club-explore-page__recruit-section">
          <div className="club-explore-page__recruit-header">
            <button
              className="club-explore-page__recruit-title-btn"
              type="button"
              onClick={toggleInterclub}
            >
              {interclubExpanded ? (
                <ChevronUpIcon size={18} />
              ) : (
                <ChevronDownIcon size={18} />
              )}
              <span className="club-explore-page__recruit-title">
                교류전 모집 중
              </span>
            </button>
            <button
              className="club-explore-page__recruit-more"
              onClick={() => navigate("/clubs/explore/recruit?type=INTERCLUB")}
            >
              전체보기
            </button>
          </div>
          {!interclubExpanded ? null : interclubRecruit.length === 0 ? (
            <div className="club-explore-page__recruit-empty">
              모집 중인 일정이 없습니다.
            </div>
          ) : (
            <div className="club-explore-page__recruit-list">
              {interclubRecruit.map((x) => (
                <button
                  key={`I:${x.scheduleId}`}
                  className="club-explore-page__recruit-item"
                  onClick={() =>
                    navigate(
                      `/clubs/${x.clubId}/interclub-recruit/${x.scheduleId}`
                    )
                  }
                >
                  <div className="club-explore-page__recruit-item-title">
                    {x.clubName}
                  </div>
                  <div className="club-explore-page__recruit-item-meta">
                    {new Date(x.scheduledAt).toLocaleString()} · {x.courtName}
                  </div>
                  <div className="club-explore-page__recruit-item-meta">
                    {x.currentParticipants}/{x.maxCapacity} · 비용{" "}
                    {x.cost ?? "-"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="club-explore-page__recruit-section">
          <div className="club-explore-page__recruit-header">
            <button
              className="club-explore-page__recruit-title-btn"
              type="button"
              onClick={toggleMembers}
            >
              {membersExpanded ? (
                <ChevronUpIcon size={18} />
              ) : (
                <ChevronDownIcon size={18} />
              )}
              <span className="club-explore-page__recruit-title">
                신규회원 모집 중
              </span>
            </button>
            <button
              className="club-explore-page__recruit-more"
              onClick={() => navigate("/clubs/explore/recruit-clubs")}
            >
              전체보기
            </button>
          </div>
          {!membersExpanded ? null : recruitClubs.length === 0 ? (
            <div className="club-explore-page__recruit-empty">
              모집 중인 클럽이 없습니다.
            </div>
          ) : (
            <div className="club-explore-page__recruit-list">
              {recruitClubs.map((c) => (
                <button
                  key={`M:${c.id}`}
                  className="club-explore-page__recruit-item"
                  onClick={() => navigate(`/clubs/${c.id}/detail`)}
                >
                  <div className="club-explore-page__recruit-item-title">
                    {c.name}
                  </div>
                  <div className="club-explore-page__recruit-item-meta">
                    {c.region ?? "-"}
                  </div>
                  {isNotEmpty(c.description) ? (
                    <div className="club-explore-page__recruit-item-meta">
                      {c.description}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubExplorePage;
