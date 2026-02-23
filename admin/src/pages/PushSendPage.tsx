import { useState, useEffect } from "react";
import {
  sendNotification,
  getClubs,
  getSchedulesByClub,
  getClubMemberIds,
} from "../services/notificationService";
import type { ClubItem, ScheduleSimple, PageResponse } from "../services/notificationService";
import { formatShortDateTime } from "../utils/dateUtils";
import MemberSelectModal from "../components/MemberSelectModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [showMemberModal, setShowMemberModal] = useState(false);

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

  const handleOpenMemberModal = () => {
    if (!clubId) {
      setMessage({ text: "먼저 클럽을 선택해주세요.", isError: true });
      return;
    }
    setShowMemberModal(true);
  };

  const handleMemberSelectConfirm = (selectedIds: number[]) => {
    setUserIdsInput(selectedIds.join(", "));
    setShowMemberModal(false);
    setMessage({ text: `${selectedIds.length}명의 클럽원이 선택되었습니다.`, isError: false });
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">알림 발송</h2>
        <p className="text-sm text-muted-foreground mt-1">
          FCM 푸시 알림을 수동으로 발송합니다. 알림은 DB에 저장되고, 대상 사용자에게 푸시가 전송됩니다.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg text-sm font-medium",
            message.isError
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-green-50 text-green-700 border border-green-200"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* 클럽 */}
        <div className="space-y-1.5">
          <Label>클럽 *</Label>
          <Select value={clubId} onValueChange={setClubId}>
            <SelectTrigger>
              <SelectValue placeholder="클럽 선택" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} (ID: {c.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 수신자 */}
        <div className="space-y-1.5">
          <Label>수신자 User ID (콤마로 구분) *</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              className="flex-1 min-w-0"
              type="text"
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              placeholder="예: 1, 2, 3"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleSelectAllMembers}
              disabled={!clubId || loadingMembers}
            >
              {loadingMembers ? "로딩..." : "클럽 전체"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleOpenMemberModal}
              disabled={!clubId}
            >
              클럽원 검색
            </Button>
          </div>
        </div>

        {/* 제목 */}
        <div className="space-y-1.5">
          <Label>제목 *</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="알림 제목"
          />
        </div>

        {/* 내용 */}
        <div className="space-y-1.5">
          <Label>내용 *</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="알림 내용"
            rows={3}
          />
        </div>

        {/* 알림 타입 */}
        <div className="space-y-1.5">
          <Label>알림 타입</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 리소스 선택 테이블 */}
        {showResourceTable && (
          <div className="space-y-2">
            <Label>
              {type === "SCHEDULE" ? "일정 선택" : "대진표 선택"}
              {selectedResourceId && (
                <span className="ml-2 text-xs text-primary font-normal">
                  (선택됨: ID {selectedResourceId})
                </span>
              )}
            </Label>
            {loadingSchedules ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {type === "DRAW" ? "확정된 대진표가 없습니다." : "일정이 없습니다."}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>코트명</TableHead>
                        <TableHead>일시</TableHead>
                        <TableHead>인원</TableHead>
                        {type === "SCHEDULE" && <TableHead>대진표</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((s) => (
                        <TableRow
                          key={s.id}
                          className={cn(
                            "cursor-pointer",
                            selectedResourceId === s.id && "bg-primary/5"
                          )}
                          onClick={() => handleResourceSelect(s)}
                        >
                          <TableCell>{s.id}</TableCell>
                          <TableCell>{s.courtName}</TableCell>
                          <TableCell>{formatShortDateTime(s.scheduledAt)}</TableCell>
                          <TableCell>
                            {s.currentParticipants}/{s.maxCapacity}
                          </TableCell>
                          {type === "SCHEDULE" && (
                            <TableCell>{s.isDrawValid ? "확정" : "-"}</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {schedulesPage && schedulesPage.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={schedulesPage.first}
                      onClick={() => loadSchedules(0)}
                      title="처음"
                    >
                      «
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={schedulesPage.first}
                      onClick={() => loadSchedules(currentPage - 1)}
                      title="이전"
                    >
                      ‹
                    </Button>
                    {Array.from({ length: schedulesPage.totalPages }, (_, i) => i)
                      .filter((page) => Math.abs(page - currentPage) <= 2)
                      .map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => loadSchedules(page)}
                        >
                          {page + 1}
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={schedulesPage.last}
                      onClick={() => loadSchedules(currentPage + 1)}
                      title="다음"
                    >
                      ›
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={schedulesPage.last}
                      onClick={() => loadSchedules(schedulesPage.totalPages - 1)}
                      title="마지막"
                    >
                      »
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? "발송 중..." : "알림 발송"}
        </Button>
      </div>

      {showMemberModal && clubId && (
        <MemberSelectModal
          clubId={Number(clubId)}
          initialSelectedIds={parseUserIds(userIdsInput)}
          onConfirm={handleMemberSelectConfirm}
          onClose={() => setShowMemberModal(false)}
        />
      )}
    </div>
  );
}

export default PushSendPage;
