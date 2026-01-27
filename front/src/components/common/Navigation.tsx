import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getOpenRunSession } from "../../utils/openrunSession";
import "./Navigation.css";

// 선 스타일 SVG 아이콘 컴포넌트
const HomeIcon: React.FC<{ isActive: boolean }> = () => (
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
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CalendarIcon: React.FC<{ isActive: boolean }> = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrophyIcon: React.FC<{ isActive: boolean }> = () => (
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
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
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

  const isClubRoute =
    location.pathname === "/clubs" ||
    location.pathname === "/clubs/explore" ||
    location.pathname.startsWith("/clubs/") ||
    location.pathname === "/club" ||
    location.pathname.startsWith("/club/");

  const isScheduleRoute = location.pathname.startsWith("/schedules/");

  // 클럽 탭 클릭 시 세션에서 최신 clubId를 읽어서 이동
  const handleClubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const session = getOpenRunSession();
    const currentClubId = session.currentClubId;
    const clubPath = currentClubId ? `/clubs/${currentClubId}` : "/clubs/explore";
    navigate(clubPath);
  };

  const navItems: Array<{
    path: string;
    label: string;
    icon: React.FC<{ isActive: boolean }>;
    comingSoon?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }> = [
    { path: "/clubs", label: "홈", icon: HomeIcon, onClick: handleClubClick },
    { path: "/schedules/club", label: "일정관리", icon: CalendarIcon },
    { path: "/scoreboard", label: "기록", icon: TrophyIcon },
    { path: "/more", label: "더보기", icon: MoreIcon },
  ];

  return (
    <nav className="navigation">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={item.onClick}
            className={({ isActive }) => {
              let forcedActive = isActive;
              if (item.label === "클럽") forcedActive = isClubRoute;
              if (item.label === "일정관리") forcedActive = isScheduleRoute;
              return `nav-item ${forcedActive ? "active" : ""}`;
            }}
          >
            {({ isActive }) => {
              let forcedActive = isActive;
              if (item.label === "클럽") forcedActive = isClubRoute;
              if (item.label === "일정관리") forcedActive = isScheduleRoute;
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
