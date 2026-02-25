import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getOpenRunSession } from "../../utils/openrunSession";
import { useLoginGuard } from "../../hooks/useLoginGuard";

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
    <defs>
      <clipPath id="ball-clip-nav">
        <circle cx="12" cy="12" r="10" />
      </clipPath>
    </defs>
    <circle cx="12" cy="12" r="10" />
    <g clipPath="url(#ball-clip-nav)">
      <path d="M7 2.5C9 7 9 17 7 21.5" />
      <path d="M17 2.5C15 7 15 17 17 21.5" />
    </g>
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
  const requireLogin = useLoginGuard();
  const session = getOpenRunSession();
  const hasClubs = session.clubList && session.clubList.length > 0;

  // Active 상태 감지
  const isExploreRoute = location.pathname === "/explore";

  const isClubHomeRoute =
    !isExploreRoute &&
    (location.pathname === "/clubs" ||
      location.pathname.startsWith("/clubs/") ||
      location.pathname === "/club" ||
      location.pathname.startsWith("/club/"));

  const isScheduleRoute = location.pathname.startsWith("/schedules/");
  const isScoreboardRoute = location.pathname === "/scoreboard" || location.pathname.startsWith("/scoreboard/");
  const isMoreRoute = location.pathname === "/more" || location.pathname.startsWith("/more/") || location.pathname.startsWith("/messages");

  // 클럽홈 탭 클릭 시 세션에서 최신 clubId를 읽어서 이동
  const handleClubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const latestSession = getOpenRunSession();
    const currentClubId = latestSession.currentClubId;
    const clubPath = currentClubId ? `/clubs/${currentClubId}` : "/explore";
    navigate(clubPath);
  };

  const navItems: Array<{
    path: string;
    label: string;
    icon: React.FC<{ isActive: boolean }>;
    onClick?: (e: React.MouseEvent) => void;
  }> = [
    { path: "/explore", label: "탐색", icon: SearchIcon },
    ...(hasClubs
      ? [
          {
            path: session.currentClubId ? `/clubs/${session.currentClubId}` : "/explore",
            label: "클럽",
            icon: UsersIcon,
            onClick: handleClubClick,
          },
        ]
      : []),
    {
      path: "/schedules/club",
      label: "일정",
      icon: TennisBallIcon,
      onClick: (e: React.MouseEvent) => {
        if (!requireLogin()) { e.preventDefault(); return; }
      },
    },
    {
      path: "/scoreboard",
      label: "기록",
      icon: BarChartIcon,
      onClick: (e: React.MouseEvent) => {
        if (!requireLogin()) { e.preventDefault(); return; }
      },
    },
    { path: "/more", label: "더보기", icon: MoreIcon },
  ];

  const isFiveTabs = navItems.length === 5;

  return (
    <nav
      className={[
        // Mobile: fixed bottom bar
        "fixed bottom-0 left-0 right-0 flex justify-around items-center",
        "bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]",
        "z-[1000] h-[68px] rounded-t-2xl",
        // Desktop: fixed left sidebar (hover:hover and pointer:fine = non-touch)
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:flex-col",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:justify-start",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:top-0",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:right-auto",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:bottom-0",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:w-[200px]",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:h-screen",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:pt-5",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:border-t-0",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:border-r",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:border-gray-200",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:shadow-[2px_0_8px_rgba(0,0,0,0.1)]",
        "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:rounded-none",
      ].join(" ")}
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
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
              if (item.label === "클럽") forcedActive = isClubHomeRoute;
              if (item.label === "일정") forcedActive = isScheduleRoute;
              if (item.label === "기록") forcedActive = isScoreboardRoute;
              if (item.label === "더보기") forcedActive = isMoreRoute;
              return [
                // Mobile: column layout, centered
                "flex flex-col items-center justify-center no-underline transition-colors duration-300 flex-1",
                isFiveTabs ? "px-2 py-2" : "px-4 py-2",
                forcedActive ? "text-primary font-semibold" : "text-gray-400",
                "hover:text-primary",
                // Desktop
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:flex-row",
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:justify-start",
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:px-6",
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:py-[18px]",
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:w-full",
                "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:flex-none",
              ].join(" ");
            }}
          >
            {({ isActive }) => {
              let forcedActive = isActive;
              if (item.label === "탐색") forcedActive = isExploreRoute;
              if (item.label === "클럽") forcedActive = isClubHomeRoute;
              if (item.label === "일정") forcedActive = isScheduleRoute;
              if (item.label === "기록") forcedActive = isScoreboardRoute;
              if (item.label === "더보기") forcedActive = isMoreRoute;
              void forcedActive;
              return (
                <>
                  <span
                    className={[
                      "flex items-center justify-center mb-1 w-6 h-6 relative",
                      "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:mb-0",
                      "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:mr-[14px]",
                      "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:w-7",
                      "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:h-7",
                    ].join(" ")}
                  >
                    <IconComponent isActive={forcedActive} />
                  </span>
                  <span
                    className={[
                      "text-[12px] whitespace-nowrap",
                      isFiveTabs ? "text-[11px]" : "",
                      "[@media_(min-width:769px)_and_(hover:hover)_and_(pointer:fine)]:text-[18px]",
                    ].join(" ")}
                  >
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
