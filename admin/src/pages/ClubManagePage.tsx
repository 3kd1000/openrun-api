import { useState, useEffect, useMemo } from "react";
import {
  getAdminClubs,
  getAdminClubDetail,
  getAdminClubMembership,
} from "../services/clubService";
import type {
  AdminClubItem,
  ClubDetail,
  ClubMemberItem,
} from "../services/clubService";
import {
  getSchedulesByClub,
  getScheduleParticipants,
} from "../services/notificationService";
import type {
  ScheduleSimple,
  ScheduleParticipant,
  PageResponse,
} from "../services/notificationService";
import { formatShortDateTime, formatScheduleDateTime } from "../utils/dateUtils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X, Users, Calendar } from "lucide-react";

function roleBadge(role: string) {
  if (role === "OWNER") return <Badge>OWNER</Badge>;
  if (role === "ADMIN") return <Badge variant="secondary">ADMIN</Badge>;
  return <Badge variant="outline">MEMBER</Badge>;
}

function boolLabel(val: boolean | null) {
  if (val === true) return <Badge className="bg-emerald-600">ON</Badge>;
  if (val === false) return <Badge variant="outline">OFF</Badge>;
  return <span className="text-muted-foreground text-xs">-</span>;
}

function statusBadge(status: string) {
  if (status === "CONFIRMED") return <Badge className="bg-emerald-600 text-xs">확정</Badge>;
  if (status === "WAITING") return <Badge variant="secondary" className="text-xs">대기</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

function ClubManagePage() {
  // ── 클럽 목록 ─────────────────────────────────────
  const [clubs, setClubs] = useState<AdminClubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

  // ── 선택된 클럽 상세 ──────────────────────────────
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<ClubMemberItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSimple[]>([]);
  const [schedulePage, setSchedulePage] = useState(0);
  const [scheduleTotalPages, setScheduleTotalPages] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── 일정 상세 모달 ────────────────────────────────
  const [modalSchedule, setModalSchedule] = useState<ScheduleSimple | null>(null);
  const [participants, setParticipants] = useState<ScheduleParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // ── 클럽 목록 로드 ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminClubs();
        setClubs(data);
      } catch {
        setError("클럽 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── 로컬 필터 ─────────────────────────────────────
  const filtered = useMemo(() => {
    if (!keyword.trim()) return clubs;
    const kw = keyword.toLowerCase();
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.regionDepth1.toLowerCase().includes(kw) ||
        c.regionDepth2.toLowerCase().includes(kw) ||
        c.ownerName.toLowerCase().includes(kw)
    );
  }, [clubs, keyword]);

  // ── 클럽 상세 로드 ────────────────────────────────
  useEffect(() => {
    if (selectedClubId === null) {
      setDetail(null);
      setMembers([]);
      setSchedules([]);
      return;
    }

    const load = async () => {
      setDetailLoading(true);
      try {
        const [d, m, s] = await Promise.all([
          getAdminClubDetail(selectedClubId),
          getAdminClubMembership(selectedClubId),
          getSchedulesByClub(selectedClubId, 0, 5),
        ]);
        setDetail(d);
        setMembers(m);
        setSchedules(s.content);
        setSchedulePage(0);
        setScheduleTotalPages(s.totalPages);
      } catch {
        setDetail(null);
        setMembers([]);
        setSchedules([]);
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedClubId]);

  // ── 일정 페이징 ───────────────────────────────────
  const loadSchedulePage = async (page: number) => {
    if (selectedClubId === null) return;
    try {
      const s: PageResponse<ScheduleSimple> = await getSchedulesByClub(
        selectedClubId,
        page,
        5
      );
      setSchedules(s.content);
      setSchedulePage(page);
      setScheduleTotalPages(s.totalPages);
    } catch {
      /* ignore */
    }
  };

  // ── 일정 카드 클릭 → 모달 ────────────────────────
  const handleScheduleClick = async (schedule: ScheduleSimple) => {
    setModalSchedule(schedule);
    setParticipants([]);
    setParticipantsLoading(true);
    try {
      const data = await getScheduleParticipants(schedule.id);
      setParticipants(data);
    } catch {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // ── 행 클릭 ───────────────────────────────────────
  const handleRowClick = (club: AdminClubItem) => {
    setSelectedClubId((prev) => (prev === club.id ? null : club.id));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold">클럽 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          전체 클럽의 정보, 멤버, 일정, 정책을 조회합니다.
        </p>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-[280px]">
          <Input
            type="text"
            placeholder="클럽명, 지역, 클럽장으로 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={cn(keyword && "pr-8")}
          />
          {keyword && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setKeyword("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length}개 클럽
        </span>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {/* 클럽 목록 테이블 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {clubs.length === 0
            ? "등록된 클럽이 없습니다."
            : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>클럽명</TableHead>
                <TableHead>지역</TableHead>
                <TableHead>클럽장</TableHead>
                <TableHead className="text-center">멤버</TableHead>
                <TableHead>개설일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((club) => (
                <TableRow
                  key={club.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    selectedClubId === club.id && "bg-primary/5"
                  )}
                  onClick={() => handleRowClick(club)}
                >
                  <TableCell>{club.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {club.logoUrl ? (
                        <img
                          src={club.logoUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                      )}
                      <span className="font-medium">{club.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {[club.regionDepth1, club.regionDepth2]
                      .filter(Boolean)
                      .join(" ")}
                  </TableCell>
                  <TableCell>{club.ownerName}</TableCell>
                  <TableCell className="text-center">
                    {club.memberCount}
                  </TableCell>
                  <TableCell className="text-xs">
                    {club.createdAt
                      ? formatShortDateTime(club.createdAt)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── 상세 섹션 ────────────────────────────── */}
      {selectedClubId !== null && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">클럽 상세</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClubId(null)}
            >
              닫기
            </Button>
          </div>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground py-4">
              상세 정보를 불러올 수 없습니다.
            </p>
          ) : (
            <>
              {/* 기본 정보 + 정책 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 기본 정보 Card */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="text-sm font-semibold mb-2">기본 정보</h4>
                  <div className="flex items-center gap-3 mb-3">
                    {detail.logoUrl ? (
                      <img
                        src={detail.logoUrl}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <div className="font-semibold">{detail.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[detail.regionDepth1, detail.regionDepth2]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>
                    </div>
                  </div>
                  {detail.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {detail.description}
                    </p>
                  )}
                  {detail.activitySummary && (
                    <p className="text-xs text-muted-foreground">
                      활동: {detail.activitySummary}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    멤버 {detail.memberCount ?? 0}명 · 개설{" "}
                    {formatShortDateTime(detail.createdAt)}
                  </div>
                </div>

                {/* 정책 Card */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="text-sm font-semibold mb-2">운영 정책</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <span className="text-muted-foreground">자동 가입</span>
                    {boolLabel(detail.autoJoinEnabled)}
                    <span className="text-muted-foreground">회원 모집</span>
                    {boolLabel(detail.memberRecruitmentOpen)}
                    <span className="text-muted-foreground">교류전 모집</span>
                    {boolLabel(detail.interclubRecruitmentOpen)}
                    <span className="text-muted-foreground">어워드</span>
                    {boolLabel(detail.awardEnabled)}
                  </div>
                  {detail.memberRecruitmentNote && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap">
                      {detail.memberRecruitmentNote}
                    </div>
                  )}
                </div>
              </div>

              {/* 멤버 Card */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-2">
                  멤버 ({members.length}명)
                </h4>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    멤버가 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>역할</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>가입일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => (
                          <TableRow key={m.memberId}>
                            <TableCell className="font-medium">
                              {m.name}
                            </TableCell>
                            <TableCell>{roleBadge(m.role)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {m.email || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatShortDateTime(m.joinedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* 일정 Card — 카드 레이아웃 */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-3">일정</h4>
                {schedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    일정이 없습니다.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {schedules.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleScheduleClick(s)}
                        >
                          <div className="font-medium text-sm mb-1 truncate">
                            {s.courtName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatScheduleDateTime(s.scheduledAt)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {s.currentParticipants}/{s.maxCapacity}
                            </span>
                            {s.isDrawValid ? (
                              <Badge className="bg-emerald-600 text-xs">
                                대진 완료
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                대진 미완
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* 일정 페이징 */}
                    {scheduleTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={schedulePage === 0}
                          onClick={() => loadSchedulePage(schedulePage - 1)}
                        >
                          ‹
                        </Button>
                        <span className="text-xs text-muted-foreground px-2">
                          {schedulePage + 1} / {scheduleTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={schedulePage >= scheduleTotalPages - 1}
                          onClick={() => loadSchedulePage(schedulePage + 1)}
                        >
                          ›
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 일정 참가자 모달 ─────────────────────── */}
      <Dialog
        open={modalSchedule !== null}
        onOpenChange={(open) => {
          if (!open) setModalSchedule(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {modalSchedule?.courtName}
            </DialogTitle>
          </DialogHeader>

          {modalSchedule && (
            <div className="space-y-4">
              {/* 일정 요약 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatScheduleDateTime(modalSchedule.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {modalSchedule.currentParticipants}/{modalSchedule.maxCapacity}
                </span>
              </div>

              {/* 참가자 목록 */}
              <div>
                <h4 className="text-sm font-semibold mb-2">참가자 목록</h4>
                {participantsLoading ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Loading...
                  </p>
                ) : participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    참가자가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                    {participants.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium truncate">
                            {p.asGuest
                              ? p.guestName || "게스트"
                              : p.userName}
                          </span>
                          {p.asGuest && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              게스트
                            </Badge>
                          )}
                        </div>
                        {statusBadge(p.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClubManagePage;
