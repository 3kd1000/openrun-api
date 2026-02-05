import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import "./NotificationPage.css";

const TYPE_LABELS: Record<string, string> = {
  SCHEDULE: "일정",
  DRAW: "대진표",
  CLUB_INVITE: "클럽 초대",
  EXTERNAL_REQUEST: "외부 신청",
  REQUEST_RESULT: "신청 결과",
  SYSTEM: "시스템",
};

const TYPE_ICONS: Record<string, string> = {
  SCHEDULE: "calendar",
  DRAW: "trophy",
  CLUB_INVITE: "mail",
  EXTERNAL_REQUEST: "users",      // 가입/게스트 신청 (운영진 수신)
  REQUEST_RESULT: "check-circle", // 신청 결과 (신청자 수신)
  SYSTEM: "info",
};

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconType = TYPE_ICONS[type] || "info";

  switch (iconType) {
    case "calendar":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "trophy":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case "mail":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "users":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "check-circle":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  // 서버에서 UTC로 저장된 날짜가 'Z' suffix 없이 올 수 있으므로 명시적으로 UTC 처리
  const normalizedDateStr = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
  const date = new Date(normalizedDateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
};

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    needsPermission,
    requestPushPermission,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleNotificationClick = (notification: {
    id: number;
    type: string;
    referenceId: number | null;
    isRead: boolean;
  }) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // 타입에 따라 페이지 이동 (referenceId가 있으면 특정 리소스로 이동)
    if (notification.type === "SCHEDULE") {
      if (notification.referenceId) {
        navigate(`/schedules/club?scheduleId=${notification.referenceId}`);
      } else {
        navigate("/schedules/club");
      }
    } else if (notification.type === "DRAW") {
      // DRAW는 대진표 모달 바로 열기
      if (notification.referenceId) {
        navigate(`/schedules/club?scheduleId=${notification.referenceId}&openDraw=true`);
      } else {
        navigate("/schedules/club");
      }
    } else if (notification.type === "CLUB_INVITE" && notification.referenceId) {
      // 클럽 초대 → 클럽 메인 페이지
      navigate(`/clubs/${notification.referenceId}`);
    } else if (notification.type === "EXTERNAL_REQUEST" && notification.referenceId) {
      // 외부 신청 (가입/게스트/교류전) → 신청 관리 페이지 (운영진용)
      navigate(`/clubs/${notification.referenceId}/manage/external-requests`);
    } else if (notification.type === "REQUEST_RESULT" && notification.referenceId) {
      // 신청 결과 → 클럽 메인 페이지 (신청자용)
      navigate(`/clubs/${notification.referenceId}`);
    }
  };

  return (
    <div className="notification-page">
      <div className="notification-page__header">
        <button
          className="notification-page__back-btn"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
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
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="notification-page__title">알림</h1>
        {unreadCount > 0 && (
          <button
            className="notification-page__read-all-btn"
            onClick={markAllAsRead}
          >
            모두 읽음
          </button>
        )}
      </div>

      {needsPermission && (
        <div className="notification-page__permission-banner">
          <div className="notification-page__permission-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="notification-page__permission-text">
            <p className="notification-page__permission-title">푸시 알림 받기</p>
            <p className="notification-page__permission-desc">일정, 대진표 등 중요한 알림을 받으려면 알림을 허용해주세요.</p>
          </div>
          <button
            className="notification-page__permission-btn"
            onClick={requestPushPermission}
          >
            허용
          </button>
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="notification-page__empty">불러오는 중...</div>
      ) : notifications.length === 0 ? (
        <div className="notification-page__empty">
          <div className="notification-page__empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p>알림이 없습니다</p>
        </div>
      ) : (
        <div className="notification-page__list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.isRead ? "notification-item--unread" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-item__icon">
                <NotificationIcon type={notification.type} />
              </div>
              <div className="notification-item__content">
                <div className="notification-item__header">
                  <span className="notification-item__type">
                    {TYPE_LABELS[notification.type] || notification.type}
                  </span>
                  <span className="notification-item__time">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <div className="notification-item__title">
                  {notification.title}
                </div>
                <div className="notification-item__body">
                  {notification.body}
                </div>
              </div>
              {!notification.isRead && (
                <div className="notification-item__dot" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
