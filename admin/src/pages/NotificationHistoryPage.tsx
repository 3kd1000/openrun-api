import { useState, useEffect, useCallback } from "react";
import {
  getNotificationHistory,
  getClubs,
} from "../services/notificationService";
import type {
  AdminNotificationResponse,
  NotificationType,
  ClubItem,
  PageResponse,
} from "../services/notificationService";
import { formatShortDateTime } from "../utils/dateUtils";
import "./NotificationHistoryPage.css";

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "시스템" },
  { value: "SCHEDULE", label: "일정" },
  { value: "DRAW", label: "대진표" },
  { value: "CLUB_INVITE", label: "클럽 초대" },
  { value: "CLUB_JOIN", label: "클럽 가입" },
];

function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<AdminNotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [type, setType] = useState<NotificationType | "">("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    getClubs().then(setClubs).catch(console.error);
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, size: 20 };
      if (clubId) params.clubId = Number(clubId);
      if (type) params.type = type;

      const response: PageResponse<AdminNotificationResponse> =
        await getNotificationHistory(params);
      setNotifications(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError("알림 이력을 불러오는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, clubId, type]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = () => {
    setPage(0);
    fetchHistory();
  };

  return (
    <div className="noti-history-page">
      <h2>알림 발송 이력</h2>
      <p className="noti-history-page__description">
        발송된 알림 내역을 클럽별, 타입별로 조회합니다.
      </p>

      <div className="noti-history-page__filters">
        <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
          <option value="">클럽 (전체)</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NotificationType | "")}
        >
          <option value="">타입 (전체)</option>
          {NOTIFICATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button className="btn-primary" onClick={handleSearch}>
          조회
        </button>
      </div>

      {error && <div className="noti-history-page__error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="noti-history-page__empty">
          <p>조회된 알림이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="noti-history-page__info">
            총 {totalElements}건 (페이지 {page + 1} / {totalPages})
          </div>
          <table className="noti-history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>클럽</th>
                <th>수신자</th>
                <th>타입</th>
                <th>제목</th>
                <th>읽음</th>
                <th>발송일시</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.clubName}</td>
                  <td>{n.userName} ({n.userId})</td>
                  <td>
                    <span className={`type-badge type-badge--${n.type.toLowerCase()}`}>
                      {n.type}
                    </span>
                  </td>
                  <td title={n.body}>{n.title}</td>
                  <td>{n.isRead ? "Y" : "N"}</td>
                  <td>{formatShortDateTime(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="noti-history-page__pagination">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              이전
            </button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationHistoryPage;
