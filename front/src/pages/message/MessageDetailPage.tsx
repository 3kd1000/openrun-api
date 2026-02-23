import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { messageService } from "../../services/messageService";
import type { MessageResponse } from "../../types/message";
import BackButton from "../../components/common/BackButton";
import { Send, Flag } from "lucide-react";
import { getOpenRunSession } from "../../utils/openrunSession";
import { useToast } from "../../contexts/ToastContext";
import { useMessage } from "../../contexts/MessageContext";

const formatMessageTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const REPORT_REASONS = [
  { value: "SPAM", label: "스팸" },
  { value: "ABUSE", label: "욕설/비하" },
  { value: "SEXUAL", label: "성적 발언" },
  { value: "OTHER", label: "기타" },
] as const;

const MessageDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { refreshUnreadCount } = useMessage();
  const { partnerId } = useParams<{ partnerId: string }>();
  const pid = partnerId ? Number(partnerId) : NaN;

  const currentUserId = useMemo(() => {
    const session = getOpenRunSession();
    const raw = session.userId?.toString();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 신고 모달 상태
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  // location.state에서 참조 정보 가져오기
  const state = location.state as {
    referenceType?: string;
    referenceId?: number;
    returnUrl?: string;
  } | null;

  const partnerName = useMemo(() => {
    if (messages.length === 0) return "";
    const msg = messages[0];
    return msg.senderId === pid ? msg.senderName : msg.receiverName;
  }, [messages, pid]);

  // location.state 우선, 없으면 messages 배열에서 추출
  const referenceInfo = useMemo(() => {
    if (state?.referenceType && state.referenceId) {
      return { type: state.referenceType, id: state.referenceId };
    }
    const refMsg = messages.find(m => m.referenceType && m.referenceId);
    if (refMsg?.referenceType && refMsg.referenceId) {
      return { type: refMsg.referenceType, id: refMsg.referenceId };
    }
    return null;
  }, [state, messages]);

  const load = async () => {
    if (!Number.isFinite(pid)) return;
    try {
      setLoading(true);
      const data = await messageService.getConversationWith(pid);
      setMessages(data);
      // 대화 진입 시 읽음 처리가 서버에서 자동으로 됨 → unreadCount 갱신
      void refreshUnreadCount();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // polling용 메시지 갱신 함수
  const fetchMessages = useCallback(async () => {
    if (!Number.isFinite(pid)) return;
    try {
      const data = await messageService.getConversationWith(pid);
      setMessages((prev) => {
        const lastNewId = data[data.length - 1]?.id ?? null;
        const lastOldId = prev[prev.length - 1]?.id ?? null;
        if (lastNewId === lastOldId) return prev; // 변경 없으면 re-render 방지
        void refreshUnreadCount();
        return data;
      });
    } catch {
      // polling 실패는 무시
    }
  }, [pid, refreshUnreadCount]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  // 5초 간격 polling (대화창 열려있을 때만, 언마운트 시 자동 정리)
  useEffect(() => {
    if (!Number.isFinite(pid)) return;
    const interval = setInterval(() => void fetchMessages(), 5000);
    return () => clearInterval(interval);
  }, [pid, fetchMessages]);

  // 새 메시지 시 스크롤 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !Number.isFinite(pid) || sending) return;
    try {
      setSending(true);
      const msg = await messageService.sendMessage({
        receiverId: pid,
        content: content.trim(),
        referenceType: state?.referenceType,
        referenceId: state?.referenceId,
      });
      setMessages((prev) => [...prev, msg]);
      setContent("");
    } catch (e) {
      console.error(e);
      showToast("메시지 전송에 실패했습니다", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleBack = () => {
    if (state?.returnUrl) {
      navigate(state.returnUrl);
    } else {
      navigate(-1);
    }
  };

  const handleReport = async () => {
    if (!reportTargetId || !reportReason) return;
    try {
      setReporting(true);
      await messageService.reportMessage(
        reportTargetId,
        reportReason,
        reportDesc.trim() || undefined
      );
      showToast("신고가 접수되었습니다", "default");
      setReportTargetId(null);
      setReportReason("");
      setReportDesc("");
    } catch (e: unknown) {
      const msg =
        e instanceof Error && e.message.includes("이미 신고")
          ? "이미 신고한 메시지입니다"
          : "신고 처리에 실패했습니다";
      showToast(msg, "error");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="page-container flex flex-col" style={{ height: "calc(100dvh - 68px)", paddingBottom: 0 }}>
      {/* 헤더 */}
      <div className="relative flex items-center py-2 mb-2 shrink-0">
        <BackButton onClick={handleBack} />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-foreground pointer-events-none">
          {partnerName || "대화"}
        </span>
      </div>

      {/* 참조 정보 배너 - 클릭 시 일정 상세로 이동 */}
      {referenceInfo?.type === "PUBLIC_SCHEDULE" && (
        <button
          type="button"
          className="mx-0 mb-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary shrink-0 w-full text-left flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => navigate(`/schedules/${referenceInfo.id}/recruit`, {
            state: { returnUrl: `/messages/${partnerId}` },
          })}
        >
          <span>공개일정 #{referenceInfo.id} 관련 대화</span>
          <span className="text-primary/60">일정 보기 →</span>
        </button>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {loading ? (
          <div className="py-6 text-muted-foreground text-center text-sm">
            로딩 중...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-muted-foreground text-center text-sm">
            대화를 시작해보세요
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {/* 상대 메시지 왼쪽: 신고 버튼은 오른쪽에 배치 */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-1.5 ${
                      isMine
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words mb-0">
                      {msg.content}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 mb-0 ${
                        isMine ? "text-white/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                  {/* 상대 메시지에만 신고 버튼 */}
                  {!isMine && (
                    <button
                      type="button"
                      className="shrink-0 p-1 text-muted-foreground/40 hover:text-red-400 transition-colors"
                      onClick={() => setReportTargetId(msg.id)}
                      title="신고"
                    >
                      <Flag size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="shrink-0 border-t border-border bg-white px-3 pt-2 pb-2">
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm min-h-[40px] max-h-[120px] resize-none focus:outline-none focus:border-primary transition-colors"
            placeholder="메시지를 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
          />
          <button
            type="button"
            className="shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={sending || !content.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* 신고 모달 */}
      {reportTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-[90%] max-w-[340px] p-5">
            <h3 className="text-sm font-bold mb-3">메시지 신고</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    reportReason === r.value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-foreground border-border hover:border-primary/50"
                  }`}
                  onClick={() => setReportReason(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary mb-3"
              placeholder="상세 내용 (선택)"
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              rows={2}
              maxLength={500}
            />

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-sm border border-border text-foreground hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setReportTargetId(null);
                  setReportReason("");
                  setReportDesc("");
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                onClick={handleReport}
                disabled={!reportReason || reporting}
              >
                {reporting ? "처리 중..." : "신고하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDetailPage;
