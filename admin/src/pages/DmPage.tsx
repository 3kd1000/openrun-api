import { useEffect, useRef, useState } from "react";
import adminMessageService, {
  type Conversation,
  type Message,
  type UserSearchResult,
} from "../services/adminMessageService";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko });
  } catch {
    return dateStr;
  }
};

function DmPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // 새 DM 시작
  const [newDmMode, setNewDmMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 대화 목록 로드
  const loadConversations = async () => {
    try {
      const data = await adminMessageService.getConversations();
      data.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      setConversations(data);
    } catch (e) {
      console.error("대화 목록 로드 실패:", e);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  // 특정 대화 선택 시 메시지 로드
  const selectConversation = async (partnerId: number, partnerName: string) => {
    setSelectedUserId(partnerId);
    setSelectedUserName(partnerName);
    setNewDmMode(false);
    setLoadingMsgs(true);
    try {
      const data = await adminMessageService.getConversationWith(partnerId);
      setMessages(data);
    } catch (e) {
      console.error("메시지 로드 실패:", e);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // 스크롤 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 유저 검색
  useEffect(() => {
    if (!searchKeyword.trim() || searchKeyword.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await adminMessageService.searchUsers(searchKeyword.trim());
        setSearchResults(results);
      } catch (e) {
        console.error("유저 검색 실패:", e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 메시지 발송
  const handleSend = async () => {
    if (!content.trim() || !selectedUserId || sending) return;
    try {
      setSending(true);
      const msg = await adminMessageService.sendMessage(selectedUserId, content.trim());
      setMessages((prev) => [...prev, msg]);
      setContent("");
      // 대화 목록도 갱신
      void loadConversations();
    } catch (e) {
      console.error("메시지 발송 실패:", e);
      alert("메시지 발송에 실패했습니다.");
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

  // 검색 결과에서 대화 시작
  const startDmWith = (user: UserSearchResult) => {
    setSearchKeyword("");
    setSearchResults([]);
    void selectConversation(user.id, user.name);
  };

  return (
    <div className="dm-page">
      <div className="dm-page__header">
        <h2>DM 관리</h2>
        <button
          className="dm-new-btn"
          onClick={() => {
            setNewDmMode(true);
            setSelectedUserId(null);
            setMessages([]);
            setSearchKeyword("");
            setSearchResults([]);
          }}
        >
          + 새 DM 시작
        </button>
      </div>

      <div className="dm-page__body">
        {/* 좌측: 대화 목록 */}
        <div className="dm-conv-list">
          {loadingConvs ? (
            <div className="dm-loading">로딩 중...</div>
          ) : conversations.length === 0 ? (
            <div className="dm-empty">대화가 없습니다</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                className={`dm-conv-item ${selectedUserId === conv.partnerId && !newDmMode ? "active" : ""}`}
                onClick={() => void selectConversation(conv.partnerId, conv.partnerName)}
              >
                <div className="dm-conv-item__avatar">
                  {conv.partnerName.charAt(0)}
                </div>
                <div className="dm-conv-item__info">
                  <div className="dm-conv-item__name">
                    {conv.partnerName}
                    {conv.unreadCount > 0 && (
                      <span className="dm-conv-item__badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <div className="dm-conv-item__last">{conv.lastMessage}</div>
                  <div className="dm-conv-item__time">{formatTime(conv.lastMessageAt)}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 우측: 메시지 스레드 또는 새 DM */}
        <div className="dm-thread">
          {newDmMode ? (
            /* 새 DM 시작 - 사용자 검색 */
            <div className="dm-thread__new">
              <div className="dm-thread__new-title">새 DM 시작</div>
              <div className="dm-search-wrapper">
                <input
                  className="dm-search-input"
                  type="text"
                  placeholder="이름으로 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  autoFocus
                />
                {searching && <div className="dm-search-hint">검색 중...</div>}
                {searchResults.length > 0 && (
                  <div className="dm-search-results">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        className="dm-search-result-item"
                        onClick={() => startDmWith(user)}
                      >
                        <span className="dm-search-result-name">{user.name}</span>
                        {(user.regionDepth1 || user.regionDepth2) && (
                          <span className="dm-search-result-region">
                            {[user.regionDepth1, user.regionDepth2].filter(Boolean).join(" ")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {!searching && searchKeyword.trim() && searchResults.length === 0 && (
                  <div className="dm-search-hint">검색 결과 없음</div>
                )}
              </div>
            </div>
          ) : selectedUserId ? (
            /* 선택된 대화 스레드 */
            <>
              <div className="dm-thread__header">
                {selectedUserName}
              </div>
              <div className="dm-thread__messages">
                {loadingMsgs ? (
                  <div className="dm-loading">메시지 로딩 중...</div>
                ) : messages.length === 0 ? (
                  <div className="dm-empty">아직 메시지가 없습니다. 첫 메시지를 보내보세요.</div>
                ) : (
                  messages.map((msg) => {
                    // 운영자가 보낸 메시지 = receiverId가 상대방
                    const isSentByOperator = msg.receiverId === selectedUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`dm-msg ${isSentByOperator ? "dm-msg--mine" : "dm-msg--other"}`}
                      >
                        <div className="dm-msg__bubble">{msg.content}</div>
                        <div className="dm-msg__time">{formatTime(msg.createdAt)}</div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="dm-thread__input">
                <textarea
                  className="dm-textarea"
                  placeholder={`${selectedUserName}에게 메시지 보내기`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={sending}
                />
                <button
                  className="dm-send-btn"
                  onClick={handleSend}
                  disabled={sending || !content.trim()}
                >
                  {sending ? "발송 중..." : "발송"}
                </button>
              </div>
            </>
          ) : (
            <div className="dm-thread__placeholder">
              좌측에서 대화를 선택하거나<br />새 DM을 시작하세요.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dm-page { display: flex; flex-direction: column; height: 100%; padding: 24px; gap: 16px; }
        .dm-page__header { display: flex; align-items: center; justify-content: space-between; }
        .dm-page__header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
        .dm-new-btn { padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
        .dm-new-btn:hover { background: #43A047; }
        .dm-page__body { display: flex; gap: 16px; flex: 1; min-height: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: white; }
        .dm-conv-list { width: 260px; border-right: 1px solid #e5e7eb; overflow-y: auto; flex-shrink: 0; }
        .dm-loading, .dm-empty { padding: 24px; color: #6b7280; font-size: 0.875rem; text-align: center; }
        .dm-conv-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; border: none; background: transparent; cursor: pointer; text-align: left; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .dm-conv-item:hover { background: #f9fafb; }
        .dm-conv-item.active { background: #f0fdf4; }
        .dm-conv-item__avatar { width: 36px; height: 36px; border-radius: 50%; background: #d1fae5; color: #065f46; font-weight: 700; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dm-conv-item__info { flex: 1; min-width: 0; }
        .dm-conv-item__name { font-size: 0.875rem; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px; }
        .dm-conv-item__badge { background: #4CAF50; color: white; font-size: 0.7rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
        .dm-conv-item__last { font-size: 0.75rem; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
        .dm-conv-item__time { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
        .dm-thread { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .dm-thread__header { padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 0.9375rem; }
        .dm-thread__messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
        .dm-thread__input { padding: 12px 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: flex-end; }
        .dm-textarea { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; resize: none; font-family: inherit; outline: none; }
        .dm-textarea:focus { border-color: #4CAF50; }
        .dm-send-btn { padding: 8px 18px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; white-space: nowrap; }
        .dm-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dm-send-btn:hover:not(:disabled) { background: #43A047; }
        .dm-msg { display: flex; flex-direction: column; max-width: 70%; }
        .dm-msg--mine { align-self: flex-end; align-items: flex-end; }
        .dm-msg--other { align-self: flex-start; align-items: flex-start; }
        .dm-msg__bubble { padding: 8px 12px; border-radius: 16px; font-size: 0.875rem; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
        .dm-msg--mine .dm-msg__bubble { background: #4CAF50; color: white; border-bottom-right-radius: 4px; }
        .dm-msg--other .dm-msg__bubble { background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; }
        .dm-msg__time { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
        .dm-thread__placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 0.875rem; text-align: center; line-height: 1.6; }
        .dm-thread__new { padding: 24px; }
        .dm-thread__new-title { font-weight: 700; font-size: 0.9375rem; margin-bottom: 16px; }
        .dm-search-wrapper { position: relative; }
        .dm-search-input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; outline: none; box-sizing: border-box; }
        .dm-search-input:focus { border-color: #4CAF50; }
        .dm-search-hint { padding: 8px 4px; font-size: 0.8125rem; color: #9ca3af; }
        .dm-search-results { border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 8px; overflow: hidden; }
        .dm-search-result-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: white; cursor: pointer; text-align: left; border-bottom: 1px solid #f3f4f6; }
        .dm-search-result-item:last-child { border-bottom: none; }
        .dm-search-result-item:hover { background: #f9fafb; }
        .dm-search-result-name { font-size: 0.875rem; font-weight: 600; color: #111827; }
        .dm-search-result-region { font-size: 0.75rem; color: #6b7280; }
      `}</style>
    </div>
  );
}

export default DmPage;
