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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "시스템" },
  { value: "SCHEDULE", label: "일정" },
  { value: "DRAW", label: "대진표" },
  { value: "CLUB_INVITE", label: "클럽 초대" },
  { value: "EXTERNAL_REQUEST", label: "외부 신청" },
  { value: "REQUEST_RESULT", label: "신청 결과" },
];

const TYPE_BADGE_STYLES: Record<string, string> = {
  SYSTEM: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-0",
  SCHEDULE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0",
  DRAW: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-0",
  CLUB_INVITE: "bg-pink-100 text-pink-800 hover:bg-pink-100 border-0",
  EXTERNAL_REQUEST: "bg-violet-100 text-violet-800 hover:bg-violet-100 border-0",
  REQUEST_RESULT: "bg-sky-100 text-sky-800 hover:bg-sky-100 border-0",
};

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">알림 발송 이력</h2>
        <p className="text-muted-foreground mt-1">
          발송된 알림 내역을 클럽별, 타입별로 조회합니다.
        </p>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={clubId || "_all"}
          onValueChange={(val) => setClubId(val === "_all" ? "" : val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="클럽 (전체)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">클럽 (전체)</SelectItem>
            {clubs.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type || "_all"}
          onValueChange={(val) => setType(val === "_all" ? "" : (val as NotificationType))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="타입 (전체)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">타입 (전체)</SelectItem>
            {NOTIFICATION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>조회</Button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground rounded-lg border bg-card">
          조회된 알림이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            총 {totalElements}건 (페이지 {page + 1} / {totalPages})
          </p>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>클럽</TableHead>
                  <TableHead>수신자</TableHead>
                  <TableHead className="w-[120px]">타입</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[60px]">읽음</TableHead>
                  <TableHead>발송일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-muted-foreground text-sm">{n.id}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-sm">{n.clubName}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm">
                      {n.userName} ({n.userId})
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs font-semibold",
                          TYPE_BADGE_STYLES[n.type] ?? "bg-muted text-muted-foreground border-0"
                        )}
                      >
                        {n.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-sm"
                      title={n.body}
                    >
                      {n.title}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {n.isRead ? "Y" : "N"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatShortDateTime(n.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationHistoryPage;
