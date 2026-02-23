import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { messageService } from "../../services/messageService";
import type { ConversationResponse } from "../../types/message";
import BackButton from "../../components/common/BackButton";
import { MessageCircle } from "lucide-react";

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 24) return `${diffHr}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString();
};

const MessageListPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await messageService.getConversations();
        // 최근 메시지 순으로 정렬
        data.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
        setConversations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="relative flex items-center py-2 mb-3">
        <BackButton onClick={() => navigate(-1)} />
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-foreground pointer-events-none">
          메시지
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-muted-foreground text-center">로딩 중...</div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageCircle size={48} className="mb-3 opacity-30" />
          <p className="text-sm">아직 대화가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              type="button"
              className="flex items-center gap-3 p-4 border border-border rounded-xl bg-white cursor-pointer transition-colors hover:bg-muted/50 text-left w-full"
              onClick={() => navigate(`/messages/${conv.partnerId}`)}
            >
              {/* 아바타 placeholder */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {conv.partnerName.charAt(0)}
                </span>
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {conv.partnerName}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatTimeAgo(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-[11px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageListPage;
