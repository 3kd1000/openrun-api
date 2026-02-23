import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";

interface AppHeaderProps {
  children?: React.ReactNode;
  showBell?: boolean;
}

/**
 * AppHeader - 앱 전역 상단 헤더
 * - 3열 Grid 레이아웃: 좌측 spacer | 중앙 children | 우측 bell
 * - children(ClubSelector)이 정확히 화면 중앙에 배치됨
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ children, showBell = true }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();

  const handleBellClick = () => {
    navigate("/notifications");
  };

  if (!showBell) {
    return (
      <header className="flex justify-center items-center px-4 py-1 bg-white border-b border-gray-200 min-h-[48px] gap-2">
        <div className="flex items-center justify-center">
          {children}
        </div>
      </header>
    );
  }

  return (
    <header className="grid items-center px-4 py-1 bg-white border-b border-gray-200 min-h-[48px] gap-2 max-[480px]:px-2 max-[480px]:gap-1"
      style={{ gridTemplateColumns: "36px 1fr 36px" }}
    >
      {/* 좌측 spacer - bell과 대칭을 위해 */}
      <div className="w-9 max-[480px]:w-8" />

      <div className="flex items-center justify-center">
        {children}
      </div>

      <button
        className="relative flex items-center justify-center w-9 h-9 p-0 bg-transparent border-none rounded-full cursor-pointer text-gray-500 transition-colors duration-200 shrink-0 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 max-[480px]:w-8 max-[480px]:h-8"
        onClick={handleBellClick}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 미읽음)` : ""}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="max-[480px]:w-5 max-[480px]:h-5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-[5px] text-[11px] font-semibold leading-[18px] text-center text-white bg-primary rounded-[9px] max-[480px]:top-0 max-[480px]:right-0 max-[480px]:min-w-[16px] max-[480px]:h-[16px] max-[480px]:text-[10px] max-[480px]:leading-[16px] max-[480px]:px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </header>
  );
};

export default AppHeader;
