import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useMessage } from "../../contexts/MessageContext";

interface AppHeaderProps {
  children?: React.ReactNode;
  showBell?: boolean;
  /** 서브페이지 모드: onBack 제공 시 백버튼 + 중앙 제목 레이아웃 */
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

/**
 * AppHeader - 앱 전역 상단 헤더
 * - 기본 모드: 4열 Grid (spacer | children | 메시지 | 알림)
 * - 서브페이지 모드 (onBack 제공): [← 백버튼] [중앙 title] [rightElement|spacer]
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ children, showBell = true, title, onBack, rightElement }) => {
  const navigate = useNavigate();
  const { unreadCount: notifUnread } = useNotification();
  const { unreadCount: msgUnread } = useMessage();

  const handleBellClick = () => {
    navigate("/notifications");
  };

  const handleMessageClick = () => {
    navigate("/messages");
  };

  // 서브페이지 모드: 백버튼 + 중앙 제목
  if (onBack) {
    return (
      <header className="flex items-center justify-between px-4 py-1 bg-white border-b border-gray-200 min-h-[48px]">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-foreground"
          onClick={onBack}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="flex-1 text-center text-sm font-bold text-foreground">{title}</span>
        {rightElement || <div className="w-9 h-9" />}
      </header>
    );
  }

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
    <header className="grid items-center px-4 py-1 bg-white border-b border-gray-200 min-h-[48px] gap-1 max-[480px]:px-2"
      style={{ gridTemplateColumns: "72px 1fr 36px 36px" }}
    >
      {/* 좌측 spacer - 우측 아이콘 2개(72px)와 대칭 */}
      <div />

      <div className="flex items-center justify-center">
        {children}
      </div>

      {/* 메시지 아이콘 */}
      <button
        className="relative flex items-center justify-center w-9 h-9 p-0 bg-transparent border-none rounded-full cursor-pointer text-gray-500 transition-colors duration-200 shrink-0 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 max-[480px]:w-8 max-[480px]:h-8"
        onClick={handleMessageClick}
        aria-label={`메시지 ${msgUnread > 0 ? `(${msgUnread}개 미읽음)` : ""}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="max-[480px]:w-5 max-[480px]:h-5"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
        {msgUnread > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full max-[480px]:top-0.5 max-[480px]:right-0.5 max-[480px]:w-2 max-[480px]:h-2" />
        )}
      </button>

      {/* 알림 bell 아이콘 */}
      <button
        className="relative flex items-center justify-center w-9 h-9 p-0 bg-transparent border-none rounded-full cursor-pointer text-gray-500 transition-colors duration-200 shrink-0 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 max-[480px]:w-8 max-[480px]:h-8"
        onClick={handleBellClick}
        aria-label={`알림 ${notifUnread > 0 ? `(${notifUnread}개 미읽음)` : ""}`}
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
        {notifUnread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-[5px] text-[11px] font-semibold leading-[18px] text-center text-white bg-primary rounded-[9px] max-[480px]:top-0 max-[480px]:right-0 max-[480px]:min-w-[16px] max-[480px]:h-[16px] max-[480px]:text-[10px] max-[480px]:leading-[16px] max-[480px]:px-1">
            {notifUnread > 99 ? "99+" : notifUnread}
          </span>
        )}
      </button>
    </header>
  );
};

export default AppHeader;
