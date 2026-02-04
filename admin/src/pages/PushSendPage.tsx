import { useState, useEffect } from "react";
import {
  sendNotification,
  getClubs,
} from "../services/notificationService";
import type { ClubItem } from "../services/notificationService";
import "./PushSendPage.css";

const NOTIFICATION_TYPES = [
  { value: "SYSTEM", label: "시스템" },
  { value: "SCHEDULE", label: "일정" },
  { value: "DRAW", label: "대진표" },
  { value: "CLUB_INVITE", label: "클럽 초대" },
  { value: "CLUB_JOIN", label: "클럽 가입" },
];

function PushSendPage() {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [title, setTitle] = useState("테스트 알림");
  const [body, setBody] = useState("이것은 테스트 푸시 알림입니다.");
  const [type, setType] = useState("SYSTEM");
  const [referenceId, setReferenceId] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    getClubs().then(setClubs).catch(console.error);
  }, []);

  const parseUserIds = (input: string): number[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
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
        referenceId: referenceId ? Number(referenceId) : null,
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
          <input
            type="text"
            value={userIdsInput}
            onChange={(e) => setUserIdsInput(e.target.value)}
            placeholder="예: 1, 2, 3"
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
          <label>참조 ID (선택)</label>
          <input
            type="number"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="관련 리소스 ID (예: scheduleId)"
          />
        </div>

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
