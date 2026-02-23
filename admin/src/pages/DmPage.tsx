import { useEffect, useMemo, useRef, useState } from "react";
import adminMessageService, {
  type ClubOwnerInfo,
  type Conversation,
  type Message,
  type UserSearchResult,
} from "../services/adminMessageService";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko });
  } catch {
    return dateStr;
  }
};

// 새 DM 검색 모드
type SearchMode = "user" | "club";

function DmPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showThread, setShowThread] = useState(false); // 모바일 패널 토글

  // 새 DM 시작
  const [newDmMode, setNewDmMode] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("user");

  // 이름 검색 모드
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // 클럽장 찾기 모드
  const [clubOwners, setClubOwners] = useState<ClubOwnerInfo[]>([]);
  const [clubOwnerKeyword, setClubOwnerKeyword] = useState("");
  const [loadingClubOwners, setLoadingClubOwners] = useState(false);

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
    setShowThread(true); // 모바일에서 스레드 패널로 전환
    setLoadingMsgs(true);
    try {
      const data = await adminMessageService.getConversationWith(partnerId);
      setMessages(data);
      // 읽음 처리 후 대화 목록의 unreadCount 갱신
      void loadConversations();
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

  // 이름 검색 (디바운스)
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

  // 클럽장 목록 - 클럽장 찾기 탭으로 전환 시 한 번 로드
  const loadClubOwners = async () => {
    if (clubOwners.length > 0) return; // 이미 로드됨
    setLoadingClubOwners(true);
    try {
      const data = await adminMessageService.getClubOwners();
      setClubOwners(data);
    } catch (e) {
      console.error("클럽 오너 목록 로드 실패:", e);
    } finally {
      setLoadingClubOwners(false);
    }
  };

  // 클럽장 목록 로컬 필터링
  const filteredClubOwners = useMemo(() => {
    if (!clubOwnerKeyword.trim()) return clubOwners;
    const kw = clubOwnerKeyword.trim().toLowerCase();
    return clubOwners.filter(
      (c) =>
        c.clubName.toLowerCase().includes(kw) ||
        c.ownerName.toLowerCase().includes(kw) ||
        c.regionDepth1.toLowerCase().includes(kw) ||
        c.regionDepth2.toLowerCase().includes(kw)
    );
  }, [clubOwners, clubOwnerKeyword]);

  // 메시지 발송
  const handleSend = async () => {
    if (!content.trim() || !selectedUserId || sending) return;
    try {
      setSending(true);
      const msg = await adminMessageService.sendMessage(selectedUserId, content.trim());
      setMessages((prev) => [...prev, msg]);
      setContent("");
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

  // 이름 검색 결과에서 대화 시작
  const startDmWith = (user: UserSearchResult) => {
    setSearchKeyword("");
    setSearchResults([]);
    void selectConversation(user.id, user.name);
  };

  // 클럽장 선택에서 대화 시작
  const startDmWithOwner = (owner: ClubOwnerInfo) => {
    if (!owner.ownerUserId) return;
    setClubOwnerKeyword("");
    void selectConversation(owner.ownerUserId, owner.ownerName);
  };

  // 새 DM 패널 열기
  const openNewDmPanel = () => {
    setNewDmMode(true);
    setSelectedUserId(null);
    setMessages([]);
    setSearchKeyword("");
    setSearchResults([]);
    setClubOwnerKeyword("");
    setSearchMode("user");
    setShowThread(true);
  };

  // 검색 모드 전환
  const switchSearchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    if (mode === "club") {
      void loadClubOwners();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">DM 관리</h2>
        <Button size="sm" onClick={openNewDmPanel}>
          + 새 DM 시작
        </Button>
      </div>

      {/* 바디 */}
      <div className="flex flex-1 min-h-0 border border-border rounded-xl overflow-hidden bg-card">
        {/* 좌측: 대화 목록 (모바일에서 showThread가 true이면 숨김) */}
        <div
          className={cn(
            "w-64 shrink-0 border-r border-border flex flex-col",
            showThread ? "hidden md:flex" : "flex"
          )}
        >
          <ScrollArea className="flex-1">
            {loadingConvs ? (
              <div className="p-6 text-center text-sm text-muted-foreground">로딩 중...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">대화가 없습니다</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3.5 py-3 text-left border-b border-border/50 transition-colors hover:bg-muted",
                    selectedUserId === conv.partnerId && !newDmMode && "bg-muted"
                  )}
                  onClick={() => void selectConversation(conv.partnerId, conv.partnerName)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    {conv.partnerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">{conv.partnerName}</span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</div>
                    <div className="text-[0.65rem] text-muted-foreground/70 mt-0.5">{formatTime(conv.lastMessageAt)}</div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* 우측: 메시지 스레드 또는 새 DM (모바일에서 showThread가 false이면 숨김) */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            showThread ? "flex" : "hidden md:flex"
          )}
        >
          {newDmMode ? (
            <div className="flex flex-col h-full">
              {/* 헤더 (모바일 back 버튼 포함) */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-7 w-7"
                  onClick={() => setShowThread(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-bold text-[0.9375rem]">새 DM 시작</span>
              </div>

              {/* 검색 모드 탭 */}
              <div className="flex gap-1 px-4 pt-4">
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                    searchMode === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => switchSearchMode("user")}
                >
                  이름으로 찾기
                </button>
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                    searchMode === "club"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => switchSearchMode("club")}
                >
                  클럽장 찾기
                </button>
              </div>

              {/* 이름으로 찾기 */}
              {searchMode === "user" && (
                <div className="p-4 flex-1 overflow-y-auto">
                  <Input
                    type="text"
                    placeholder="이름으로 검색..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    autoFocus
                  />
                  {searching && (
                    <div className="mt-2 text-xs text-muted-foreground">검색 중...</div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-border rounded-lg overflow-hidden">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className="flex items-center justify-between gap-2 w-full px-3.5 py-2.5 border-b border-border/50 last:border-b-0 bg-card hover:bg-muted text-left transition-colors"
                          onClick={() => startDmWith(user)}
                        >
                          <span className="text-sm font-semibold text-foreground">{user.name}</span>
                          {(user.regionDepth1 || user.regionDepth2) && (
                            <span className="text-xs text-muted-foreground">
                              {[user.regionDepth1, user.regionDepth2].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && searchKeyword.trim() && searchResults.length === 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">검색 결과 없음</div>
                  )}
                </div>
              )}

              {/* 클럽장 찾기 */}
              {searchMode === "club" && (
                <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
                  <Input
                    type="text"
                    placeholder="클럽명, 클럽장 이름, 지역으로 검색..."
                    value={clubOwnerKeyword}
                    onChange={(e) => setClubOwnerKeyword(e.target.value)}
                    autoFocus
                  />
                  <ScrollArea className="flex-1">
                    {loadingClubOwners ? (
                      <div className="text-center text-sm text-muted-foreground py-8">로딩 중...</div>
                    ) : filteredClubOwners.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        {clubOwnerKeyword ? "검색 결과 없음" : "클럽이 없습니다"}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
                        {filteredClubOwners.map((c) => (
                          <button
                            key={c.clubId}
                            className={cn(
                              "flex items-center justify-between w-full px-3.5 py-3 border-b border-border/50 last:border-b-0 text-left transition-colors",
                              c.ownerUserId
                                ? "bg-card hover:bg-muted"
                                : "bg-muted/30 cursor-not-allowed opacity-60"
                            )}
                            onClick={() => startDmWithOwner(c)}
                            disabled={!c.ownerUserId}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{c.clubName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                클럽장: {c.ownerName}
                                {(c.regionDepth1 || c.regionDepth2) && (
                                  <span className="ml-2">
                                    {[c.regionDepth1, c.regionDepth2].filter(Boolean).join(" ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : selectedUserId ? (
            <>
              {/* 스레드 헤더 (모바일 back 버튼 포함) */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-7 w-7"
                  onClick={() => setShowThread(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-bold text-[0.9375rem]">{selectedUserName}</span>
              </div>

              {/* 메시지 목록 */}
              <ScrollArea className="flex-1 px-4 py-4">
                {loadingMsgs ? (
                  <div className="text-center text-sm text-muted-foreground py-8">메시지 로딩 중...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    아직 메시지가 없습니다. 첫 메시지를 보내보세요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((msg) => {
                      const isSentByOperator = msg.receiverId === selectedUserId;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            isSentByOperator ? "self-end items-end" : "self-start items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap break-words",
                              isSentByOperator
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            )}
                          >
                            {msg.content}
                          </div>
                          <div className="text-[0.65rem] text-muted-foreground mt-1">
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* 입력창 */}
              <div className="flex gap-2 items-end p-3 border-t border-border">
                <Textarea
                  placeholder={`${selectedUserName}에게 메시지 보내기`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={sending}
                  className="flex-1 resize-none text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !content.trim()}
                  className="shrink-0"
                >
                  {sending ? "발송 중..." : "발송"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center leading-relaxed">
              좌측에서 대화를 선택하거나
              <br />
              새 DM을 시작하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DmPage;
