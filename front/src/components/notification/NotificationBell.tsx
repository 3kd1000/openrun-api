import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";

const BellIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
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
);

const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/notifications");
  };

  return (
    <button
      className="relative flex items-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer text-gray-500 p-0 rounded-full transition-colors duration-200 ease-linear hover:bg-gray-100 hover:text-primary"
      onClick={handleClick}
      aria-label="알림"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-red-500 text-white text-[11px] font-semibold leading-[18px] text-center box-border">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
