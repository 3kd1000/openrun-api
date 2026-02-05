import { useState, useEffect } from "react";
import {
  sendNotification,
  getClubs,
  getSchedulesByClub,
  getClubMemberIds,
} from "../services/notificationService";
import type { ClubItem, ScheduleSimple, PageResponse } from "../services/notificationService";
import { formatShortDateTime } from "../utils/dateUtils";
import "./PushSendPage.css";

const NOTIFICATION_TYPES = [
  { value: "SYSTEM", label: "시스템" },
  { value: "SCHEDULE", label: "일정" },
  { value: "DRAW", label: "대진표" },
  { value: "CLUB_INVITE", label: "클럽 초대" },
  { value: "EXTERNAL_REQUEST", label: "외부 신청" },
  { value: "REQUEST_RESULT", label: "신청 결과" },
];

function PushSendPage() {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [title, setTitle] = useState("테스트 알림");
  const [body, setBody] = useState("이것은 테스트 푸시 알림입니다.");
  const [type, setType] = useState("SYSTEM");
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 리소스 선택용 상태
  const [schedulesPage, setSchedulesPage] = useState<PageResponse<ScheduleSimple> | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    getClubs().then(setClubs).catch(console.error);
  }, []);

  // 클럽 또는 타입 변경 시 리소스 목록 로드 (페이지 초기화)
  useEffect(() => {
    if (!clubId || (type !== "SCHEDULE" && type !== "DRAW")) {
      setSchedulesPage(null);
      setSelectedResourceId(null);
      setReferenceId(null);
      setCurrentPage(0);
      return;
    }

    loadSchedules(0);
  }, [clubId, type]);

  const loadSchedules = async (page: number) => {
    if (!clubId) return;

    setLoadingSchedules(true);
    try {
      const data = await getSchedulesByClub(Number(clubId), page, 10);

      // DRAW 타입인 경우 isDrawValid가 true인 것만 필터링
      if (type === "DRAW") {
        setSchedulesPage({
          ...data,
          content: data.content.filter((s) => s.isDrawValid),
        });
      } else {
        setSchedulesPage(data);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("일정 로드 실패:", error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const parseUserIds = (input: string): number[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
  };

  const handleResourceSelect = (schedule: ScheduleSimple) => {
    setSelectedResourceId(schedule.id);
    setReferenceId(schedule.id);
  };

  const handleSelectAllMembers = async () => {
    if (!clubId) {
      setMessage({ text: "먼저 클럽을 선택해주세요.", isError: true });
      return;
    }

    setLoadingMembers(true);
    try {
      const userIds = await getClubMemberIds(Number(clubId));
      if (userIds.length === 0) {
        setMessage({ text: "해당 클럽에 활성 멤버가 없습니다.", isError: true });
      } else {
        setUserIdsInput(userIds.join(", "));
        setMessage({ text: `${userIds.length}명의 클럽원이 선택되었습니다.`, isError: false });
      }
    } catch (error) {
      console.error("멤버 목록 조회 실패:", error);
      setMessage({ text: "멤버 목록 조회 실패", isError: true });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSend = async () => {
    const userIds = parseUserIds(userIdsInput);
    if (!clubId || userIds.length === 0 || !title || !body) {
      setMessage({ text: "클럽, 수신자, 제목, 내용을 모두 입력해주세요.", isError: true });
      return;
    }

    setSending(true);
    setMessage(null);
    try {
      await sendNotification({
        clubId: Number(clubId),
        userIds,
        title,
        body,
        type,
        referenceId: referenceId,
        referenceType: null,
      });
      setMessage({ text: `${userIds.length}명에게 알림 발송 완료!`, isError: false });
    } catch (error) {
      console.error("알림 발송 실패:", error);
      setMessage({ text: "알림 발송 실패", isError: true });
    } finally {
      setSending(false);
    }
  };

  const showResourceTable = clubId && (type === "SCHEDULE" || type === "DRAW");
  const schedules = schedulesPage?.content || [];

  return (
    <div className="push-send-page">
      <h2>알림 발송</h2>
      <p className="push-send-page__description">
        FCM 푸시 알림을 수동으로 발송합니다. 알림은 DB에 저장되고, 대상 사용자에게 푸시가 전송됩니다.
      </p>

      {message && (
        <div className={`push-send-page__message ${message.isError ? "push-send-page__message--error" : "push-send-page__message--success"}`}>
          {message.text}
        </div>
      )}

      <div className="push-send-page__form">
        <div className="push-send-page__field">
          <label>클럽 *</label>
          <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
            <option value="">클럽 선택</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (ID: {c.id})
              </option>
            ))}
          </select>
        </div>

        <div className="push-send-page__field">
          <label>수신자 User ID (콤마로 구분) *</label>
          <div className="push-send-page__input-with-btn">
            <input
              type="text"
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              placeholder="예: 1, 2, 3"
            />
            <button
              type="button"
              className="push-send-page__select-all-btn"
              onClick={handleSelectAllMembers}
              disabled={!clubId || loadingMembers}
            >
              {loadingMembers ? "로딩..." : "클럽 전체"}
            </button>
          </div>
        </div>

        <div className="push-send-page__field">
          <label>제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="알림 제목"
          />
        </div>

        <div className="push-send-page__field">
          <label>내용 *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="알림 내용"
            rows={3}
          />
        </div>

        <div className="push-send-page__field">
          <label>알림 타입</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* 리소스 선택 테이블 */}
        {showResourceTable && (
          <div className="push-send-page__resource-section">
            <label>
              {type === "SCHEDULE" ? "일정 선택" : "대진표 선택"}
              {selectedResourceId && (
                <span className="push-send-page__selected-id"> (선택됨: ID {selectedResourceId})</span>
              )}
            </label>
            {loadingSchedules ? (
              <p className="push-send-page__loading">불러오는 중...</p>
            ) : schedules.length === 0 ? (
              <p className="push-send-page__empty">
                {type === "DRAW" ? "확정된 대진표가 없습니다." : "일정이 없습니다."}
              </p>
            ) : (
              <>
                <table className="push-send-page__resource-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>코트명</th>
                      <th>일시</th>
                      <th>인원</th>
                      {type === "SCHEDULE" && <th>대진표</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr
                        key={s.id}
                        className={selectedResourceId === s.id ? "selected" : ""}
                        onClick={() => handleResourceSelect(s)}
                      >
                        <td>{s.id}</td>
                        <td>{s.courtName}</td>
                        <td>{formatShortDateTime(s.scheduledAt)}</td>
                        <td>{s.currentParticipants}/{s.maxCapacity}</td>
                        {type === "SCHEDULE" && (
                          <td>{s.isDrawValid ? "확정" : "-"}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이징 */}
                {schedulesPage && schedulesPage.totalPages > 1 && (
                  <div className="push-send-page__pagination">
                    <button
                      type="button"
                      disabled={schedulesPage.first}
                      onClick={() => loadSchedules(0)}
                      title="처음"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      disabled={schedulesPage.first}
                      onClick={() => loadSchedules(currentPage - 1)}
                      title="이전"
                    >
                      ‹
                    </button>
                    {Array.from({ length: schedulesPage.totalPages }, (_, i) => i)
                      .filter((page) => {
                        // 현재 페이지 기준 앞뒤 2개씩만 표시 (최대 5개)
                        return Math.abs(page - currentPage) <= 2;
                      })
                      .map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={currentPage === page ? "active" : ""}
                          onClick={() => loadSchedules(page)}
                        >
                          {page + 1}
                        </button>
                      ))}
                    <button
                      type="button"
                      disabled={schedulesPage.last}
                      onClick={() => loadSchedules(currentPage + 1)}
                      title="다음"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      disabled={schedulesPage.last}
                      onClick={() => loadSchedules(schedulesPage.totalPages - 1)}
                      title="마지막"
                    >
                      »
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button
          className="btn-primary push-send-page__btn"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "발송 중..." : "알림 발송"}
        </button>
      </div>
    </div>
  );
}

export default PushSendPage;
