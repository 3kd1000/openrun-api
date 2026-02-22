import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getOpenRunSession } from "../../utils/openrunSession";
import "./Navigation.css";

// 선 스타일 SVG 아이콘 컴포넌트
const SearchIcon: React.FC<{ isActive: boolean }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const UsersIcon: React.FC<{ isActive: boolean }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TennisBallIcon: React.FC<{ isActive: boolean }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M7 2.5C9 7 9 17 7 21.5" />
    <path d="M17 2.5C15 7 15 17 17 21.5" />
  </svg>
);

const BarChartIcon: React.FC<{ isActive: boolean }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 16v-3" />
    <path d="M12 16V8" />
    <path d="M17 16V4" />
  </svg>
);

const MoreIcon: React.FC<{ isActive: boolean }> = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getOpenRunSession();
  const hasClubs = session.clubList && session.clubList.length > 0;

  // Active 상태 감지
  const isExploreRoute = location.pathname === "/clubs/explore";

  const isClubHomeRoute =
    !isExploreRoute &&
    (location.pathname === "/clubs" ||
      location.pathname.startsWith("/clubs/") ||
      location.pathname === "/club" ||
      location.pathname.startsWith("/club/"));

  const isScheduleRoute = location.pathname.startsWith("/schedules/");
  const isScoreboardRoute = location.pathname === "/scoreboard" || location.pathname.startsWith("/scoreboard/");

  // 클럽홈 탭 클릭 시 세션에서 최신 clubId를 읽어서 이동
  const handleClubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const latestSession = getOpenRunSession();
    const currentClubId = latestSession.currentClubId;
    const clubPath = currentClubId ? `/clubs/${currentClubId}` : "/clubs/explore";
    navigate(clubPath);
  };

  const navItems: Array<{
    path: string;
    label: string;
    icon: React.FC<{ isActive: boolean }>;
    onClick?: (e: React.MouseEvent) => void;
  }> = [
    { path: "/clubs/explore", label: "탐색", icon: SearchIcon },
    ...(hasClubs
      ? [
          {
            path: `/clubs/${session.currentClubId || "explore"}`,
            label: "클럽",
            icon: UsersIcon,
            onClick: handleClubClick,
          },
        ]
      : []),
    { path: "/schedules/club", label: "일정", icon: TennisBallIcon },
    { path: "/scoreboard", label: "기록", icon: BarChartIcon },
    { path: "/more", label: "더보기", icon: MoreIcon },
  ];

  return (
    <nav className={`navigation ${navItems.length === 5 ? "navigation--five-tabs" : ""}`}>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={item.onClick}
            className={({ isActive }) => {
              let forcedActive = isActive;
              if (item.label === "탐색") forcedActive = isExploreRoute;
              if (item.label === "클럽홈") forcedActive = isClubHomeRoute;
              if (item.label === "일정") forcedActive = isScheduleRoute;
              if (item.label === "스코어보드") forcedActive = isScoreboardRoute;
              return `nav-item ${forcedActive ? "active" : ""}`;
            }}
          >
            {({ isActive }) => {
              let forcedActive = isActive;
              if (item.label === "탐색") forcedActive = isExploreRoute;
              if (item.label === "클럽홈") forcedActive = isClubHomeRoute;
              if (item.label === "일정") forcedActive = isScheduleRoute;
              if (item.label === "스코어보드") forcedActive = isScoreboardRoute;
              return (
                <>
                  <span className="nav-icon">
                    <IconComponent isActive={forcedActive} />
                  </span>
                  <span className="nav-label">
                    {item.label}
                  </span>
                </>
              );
            }}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Navigation;
