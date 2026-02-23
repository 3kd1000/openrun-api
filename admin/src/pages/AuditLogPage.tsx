import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getAuditLogs, getAllClubs } from "../services/auditLogService";
import type {
  AuditLogResponse,
  AuditEntityType,
  AuditActionType,
  PageResponse,
  ClubSimple,
} from "../services/auditLogService";
import AuditLogDetailModal from "./AuditLogDetailModal";
import { formatShortDateTime } from "../utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { X } from "lucide-react";

function getActionBadge(actionType: string) {
  if (actionType === "CREATE") return <Badge>CREATE</Badge>;
  if (actionType === "DELETE") return <Badge variant="destructive">DELETE</Badge>;
  return <Badge variant="secondary">UPDATE</Badge>;
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [entityType, setEntityType] = useState<AuditEntityType | "">("");
  const [actionType, setActionType] = useState<AuditActionType | "">("");

  // Club search (로컬 필터링)
  const [allClubs, setAllClubs] = useState<ClubSimple[]>([]);
  const [clubKeyword, setClubKeyword] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubSimple | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clubInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 페이지 진입 시 모든 클럽 한 번 조회
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubs = await getAllClubs();
        setAllClubs(clubs);
      } catch (err) {
        console.error("클럽 목록 로드 실패:", err);
      }
    };
    loadClubs();
  }, []);

  // 로컬 필터링: name, regionDepth1, regionDepth2로 필터
  const filteredClubs = useMemo(() => {
    if (!clubKeyword.trim()) return [];
    const keyword = clubKeyword.toLowerCase();
    return allClubs.filter(
      (club) =>
        club.name.toLowerCase().includes(keyword) ||
        club.regionDepth1.toLowerCase().includes(keyword) ||
        club.regionDepth2.toLowerCase().includes(keyword)
    );
  }, [allClubs, clubKeyword]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, size: 20 };
      if (entityType) params.entityType = entityType;
      if (actionType) params.actionType = actionType;
      if (selectedClub) params.clubId = selectedClub.id;

      const response: PageResponse<AuditLogResponse> = await getAuditLogs(params);
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError("로그를 불러오는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, entityType, actionType, selectedClub]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 외부 클릭 시 제안 목록 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        clubInputRef.current &&
        !clubInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClubSelect = (club: ClubSimple) => {
    setSelectedClub(club);
    setClubKeyword(club.name);
    setShowSuggestions(false);
    setPage(0);
  };

  const handleClearClub = () => {
    setSelectedClub(null);
    setClubKeyword("");
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const handleRowClick = (log: AuditLogResponse) => {
    setSelectedLog(log);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  // 페이지네이션 번호 생성 (현재 페이지 기준 앞뒤 2개씩)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Audit Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule, Club, ClubMember 변경 이력을 조회합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 items-end">
        {/* 클럽 검색 (로컬 필터링) */}
        <div className="relative min-w-[200px]">
          <Input
            ref={clubInputRef}
            type="text"
            placeholder="클럽명, 지역으로 검색..."
            value={clubKeyword}
            onChange={(e) => {
              setClubKeyword(e.target.value);
              setShowSuggestions(true);
              if (selectedClub && e.target.value !== selectedClub.name) {
                setSelectedClub(null);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            className={cn(selectedClub && "pr-8 border-primary")}
          />
          {selectedClub && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClearClub}
              title="선택 해제"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {showSuggestions && filteredClubs.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md overflow-hidden max-h-48 overflow-y-auto"
            >
              {filteredClubs.slice(0, 10).map((club) => (
                <button
                  key={club.id}
                  type="button"
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border/50 last:border-b-0"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur before selection
                    handleClubSelect(club);
                  }}
                >
                  <span className="font-medium">{club.name}</span>
                  {(club.regionDepth1 || club.regionDepth2) && (
                    <span className="text-xs text-muted-foreground">
                      {[club.regionDepth1, club.regionDepth2].filter(Boolean).join(" ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Select
          value={entityType || "_all"}
          onValueChange={(val) =>
            setEntityType(val === "_all" ? "" : (val as AuditEntityType))
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Entity Type (All)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Entity Type (All)</SelectItem>
            <SelectItem value="SCHEDULE">SCHEDULE</SelectItem>
            <SelectItem value="SCHEDULE_PARTICIPANT">SCHEDULE_PARTICIPANT</SelectItem>
            <SelectItem value="MATCH">MATCH</SelectItem>
            <SelectItem value="CLUB">CLUB</SelectItem>
            <SelectItem value="CLUB_MEMBER">CLUB_MEMBER</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={actionType || "_all"}
          onValueChange={(val) =>
            setActionType(val === "_all" ? "" : (val as AuditActionType))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action Type (All)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Action Type (All)</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>조회</Button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          조회된 로그가 없습니다.
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            총 {totalElements}건 (페이지 {page + 1} / {totalPages})
            {selectedClub && (
              <span className="ml-2 text-primary">| 클럽: {selectedClub.name}</span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell>{log.id}</TableCell>
                    <TableCell className="text-xs">{log.entityType}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell>{getActionBadge(log.actionType)}</TableCell>
                    <TableCell>{log.userName || log.userId}</TableCell>
                    <TableCell>{log.clubName || log.clubId}</TableCell>
                    <TableCell className="text-xs">{formatShortDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(0)}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </Button>
            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              »
            </Button>
          </div>
        </>
      )}

      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default AuditLogPage;
