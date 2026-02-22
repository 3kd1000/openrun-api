import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/common/BackButton";
import { useNotification } from "../../contexts/NotificationContext";
import { cn } from "@/lib/utils";

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
    permissionRevoked,
    requestPushPermission,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteSelected,
    deleteRead,
    deleteAll,
  } = useNotification();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개의 알림을 삭제하시겠습니까?`)) return;
    await deleteSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
    if (notifications.length <= selectedIds.size) exitEditMode();
  };

  const handleDeleteRead = async () => {
    const readCount = notifications.filter((n) => n.isRead).length;
    if (readCount === 0) return;
    if (!window.confirm(`읽은 알림 ${readCount}개를 삭제하시겠습니까?`)) return;
    await deleteRead();
    setSelectedIds(new Set());
    if (readCount === notifications.length) exitEditMode();
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm(`모든 알림 ${notifications.length}개를 삭제하시겠습니까?`)) return;
    await deleteAll();
    exitEditMode();
  };

  const handleNotificationClick = (notification: {
    id: number;
    type: string;
    referenceId: number | null;
    isRead: boolean;
  }) => {
    // 편집 모드에서는 선택/해제만
    if (isEditMode) {
      toggleSelect(notification.id);
      return;
    }

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
      if (notification.referenceId) {
        navigate(`/schedules/club?scheduleId=${notification.referenceId}&openDraw=true`);
      } else {
        navigate("/schedules/club");
      }
    } else if (notification.type === "CLUB_INVITE" && notification.referenceId) {
      navigate(`/clubs/${notification.referenceId}`);
    } else if (notification.type === "EXTERNAL_REQUEST" && notification.referenceId) {
      navigate(`/clubs/${notification.referenceId}/manage/external-requests`);
    } else if (notification.type === "REQUEST_RESULT" && notification.referenceId) {
      navigate(`/clubs/${notification.referenceId}`);
    }
  };

  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="p-4 min-h-[calc(100vh-140px)] max-w-[600px] mx-auto md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <BackButton
          onClick={() => isEditMode ? exitEditMode() : navigate(-1)}
          ariaLabel={isEditMode ? "편집 취소" : "뒤로 가기"}
        />
        <div className="flex-1 text-2xl font-bold text-foreground">
          {isEditMode ? `${selectedIds.size}개 선택` : "알림"}
        </div>
        {!isEditMode && unreadCount > 0 && (
          <button
            className="bg-transparent border-none text-primary text-sm font-medium cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-secondary"
            onClick={markAllAsRead}
          >
            모두 읽음
          </button>
        )}
        {notifications.length > 0 && (
          <button
            className="bg-transparent border-none text-primary text-sm font-medium cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-secondary whitespace-nowrap"
            onClick={() => isEditMode ? exitEditMode() : setIsEditMode(true)}
          >
            {isEditMode ? "취소" : "편집"}
          </button>
        )}
      </div>

      {needsPermission && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="shrink-0 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">푸시 알림 받기</p>
            <p className="text-xs text-muted-foreground leading-snug">일정, 대진표 등 중요한 알림을 받으려면 알림을 허용해주세요.</p>
          </div>
          <button
            className="shrink-0 px-3 py-1 bg-primary text-primary-foreground border-none rounded-md text-sm font-medium cursor-pointer whitespace-nowrap active:opacity-80"
            onClick={requestPushPermission}
          >
            허용
          </button>
        </div>
      )}

      {permissionRevoked && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="shrink-0 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">알림이 꺼져있습니다</p>
            <p className="text-xs text-muted-foreground leading-snug">기기 설정 &gt; 알림 &gt; OpenRun에서 알림을 다시 켜주세요.</p>
          </div>
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">불러오는 중...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="mb-3 opacity-40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm">알림이 없습니다</p>
        </div>
      ) : (
        <>
          {isEditMode && (
            <div className="flex items-center gap-2 p-2 border-b border-border">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.size === notifications.length && notifications.length > 0}
                  onChange={toggleSelectAll}
                  className="shrink-0 w-[18px] h-[18px] m-0 cursor-pointer accent-primary self-center"
                />
                <span>전체 선택</span>
              </label>
              <div className="flex gap-1 ml-auto">
                <button
                  className="px-2 py-1 border border-destructive rounded-md bg-background text-destructive text-xs font-medium cursor-pointer whitespace-nowrap transition-colors hover:enabled:bg-destructive/5 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                >
                  선택 삭제{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                </button>
                <button
                  className="px-2 py-1 border border-border rounded-md bg-background text-foreground text-xs font-medium cursor-pointer whitespace-nowrap transition-colors hover:enabled:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleDeleteRead}
                  disabled={readCount === 0}
                >
                  읽은 알림 삭제{readCount > 0 ? ` (${readCount})` : ""}
                </button>
                <button
                  className="px-2 py-1 border border-destructive rounded-md bg-background text-destructive text-xs font-medium cursor-pointer whitespace-nowrap transition-colors hover:bg-destructive/5"
                  onClick={handleDeleteAll}
                >
                  전체 삭제
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center gap-3 px-2 py-3 border-b border-border cursor-pointer transition-colors relative hover:bg-secondary",
                  !notification.isRead && "bg-blue-50 hover:bg-blue-100",
                  isEditMode && selectedIds.has(notification.id) && "bg-blue-50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {isEditMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 w-[18px] h-[18px] m-0 cursor-pointer accent-primary self-center"
                  />
                )}
                <div className={cn(
                  "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  notification.isRead ? "bg-secondary text-muted-foreground" : "bg-blue-100 text-primary"
                )}>
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-primary font-medium">
                      {TYPE_LABELS[notification.type] || notification.type}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-0.5 truncate">
                    {notification.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {notification.body}
                  </div>
                </div>
                {!isEditMode && !notification.isRead && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default NotificationPage;
