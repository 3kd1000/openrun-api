import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import "./AppHeader.css";

interface AppHeaderProps {
  children?: React.ReactNode;
  showBell?: boolean;
}

/**
 * AppHeader - 앱 전역 상단 헤더
 * - 왼쪽: children (ClubSelector 등)
 * - 오른쪽: 알림 종 아이콘 + 배지
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ children, showBell = true }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();

  const handleBellClick = () => {
    navigate("/notifications");
  };

  return (
    <header className="app-header">
      <div className="app-header__left">
        {children}
      </div>
      {showBell && (
        <button
          className="app-header__bell"
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
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="app-header__badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </header>
  );
};

export default AppHeader;
