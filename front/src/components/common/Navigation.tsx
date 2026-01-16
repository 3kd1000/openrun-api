import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getOpenRunSession } from "../../utils/openrunSession";
import "./Navigation.css";

// 선 스타일 SVG 아이콘 컴포넌트
const ClubIcon: React.FC<{ isActive: boolean }> = () => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  const session = getOpenRunSession();
  const currentClubId = session.currentClubId;
  const clubPath = currentClubId ? `/clubs/${currentClubId}` : "/clubs/explore";
  const isClubRoute =
    location.pathname === "/clubs" ||
    location.pathname === "/clubs/explore" ||
    location.pathname.startsWith("/clubs/") ||
    location.pathname === "/club" ||
    location.pathname.startsWith("/club/");

  const navItems: Array<{
    path: string;
    label: string;
    icon: React.FC<{ isActive: boolean }>;
    comingSoon?: boolean;
  }> = [
    { path: clubPath, label: "클럽", icon: ClubIcon },
    { path: "/schedules", label: "일정관리", icon: CalendarIcon },
    { path: "/scoreboard", label: "스코어보드", icon: TrophyIcon },
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
            className={({ isActive }) => {
              const forcedActive = item.label === "클럽" ? isClubRoute : isActive;
              return `nav-item ${forcedActive ? "active" : ""}`;
            }}
          >
            {({ isActive }) => {
              const forcedActive = item.label === "클럽" ? isClubRoute : isActive;
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
