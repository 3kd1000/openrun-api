import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { getMyClubs, type MyClub } from "../services/api/userApi";
import { ClubSelector } from "../components/ClubSelector";
import { AppHeader } from "../components/common/AppHeader";
import { getOpenRunSession, setOpenRunSession } from "../utils/openrunSession";
import { useAuth } from "../contexts/AuthContext";
import { normalizeClubRole } from "../utils/role";
import "./ClubLayout.css";

/**
 * ClubLayout
 * - ClubSelector를 포함하는 공통 레이아웃
 * - 홈/일정관리/기록 페이지에서 공유되어 ClubSelector가 한 번만 마운트됨
 * - React Router의 Outlet을 사용하여 자식 라우트 렌더링
 * - Single Source of Truth: LocalStorage session.currentClubId
 */
export const ClubLayout: React.FC = () => {
  const { isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { clubId: clubIdParam } = useParams<{ clubId: string }>();

  // 리렌더링 트리거용 (session 변경 시 컴포넌트 강제 업데이트)
  const [refreshKey, setRefreshKey] = useState(0);

  // SSoT: session에서 직접 읽기 (state 제거)
  const session = getOpenRunSession();
  const selectedClubId = session.currentClubId
    ? parseInt(session.currentClubId)
    : null;

  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 클럽 목록은 Auth 준비 후 한 번만 로드
  useEffect(() => {
    if (!isAuthReady) {
      console.log("⏳ Firebase 인증 준비 중... 클럽 목록 로딩 대기");
      return;
    }
    loadClubs();
  }, [isAuthReady]);

  const loadClubs = async () => {
    try {
      setIsLoading(true);
      const data = await getMyClubs();
      setClubs(data);

      // 클럽이 있는데 선택된 클럽이 없으면 첫 번째 클럽 자동 선택
      // ⚠️ setClubs는 비동기이므로 최신 data를 직접 전달
      if (data.length > 0 && !selectedClubId) {
        handleClubChange(data[0].id, data);
      }
    } catch (err) {
      console.error("클럽 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClubChange = (clubId: number | null, clubsOverride?: MyClub[]) => {
    if (!clubId) return;

    // clubsOverride가 제공되면 사용, 아니면 state의 clubs 사용
    const clubsToSearch = clubsOverride ?? clubs;

    // clubs 배열에서 선택된 클럽의 role 찾기
    const selectedClub = clubsToSearch.find((club) => club.id === clubId);
    const role = normalizeClubRole(selectedClub?.role ?? "REGULAR");

    // SSoT 업데이트: session에 저장
    setOpenRunSession({
      currentClubId: clubId.toString(),
      currentClubRole: role,
    });

    console.log(`✅ 클럽 ${clubId} 변경: ${selectedClub?.name}, role: ${role}`);

    // 리렌더링 트리거 (ClubSelector가 최신 값을 표시하도록)
    setRefreshKey((prev) => prev + 1);

    // 클럽 변경 시 해당 클럽의 메인 페이지로 이동
    // /clubs/:clubId 경로에 있는 경우 URL도 업데이트
    if (location.pathname.startsWith("/clubs/")) {
      navigate(`/clubs/${clubId}`, { replace: true });
    }
  };

  // URL params 변경 감지 (ClubMainPage가 URL params로 session을 업데이트하는 경우 대응)
  useEffect(() => {
    if (clubIdParam) {
      const paramClubId = parseInt(clubIdParam);
      // URL의 clubId와 현재 선택된 clubId가 다르면 리렌더링
      if (paramClubId !== selectedClubId) {
        setRefreshKey((prev) => prev + 1);
      }
    }
  }, [clubIdParam, selectedClubId]);

  return (
    <div className="club-layout" key={refreshKey}>
      <AppHeader>
        <ClubSelector
          selectedClubId={selectedClubId}
          onClubChange={handleClubChange}
          clubs={clubs}
          isLoading={isLoading}
        />
      </AppHeader>
      <div className="club-layout__content">
        <Outlet context={{ selectedClubId, clubs, isLoading }} />
      </div>
    </div>
  );
};
