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
import "./AuditLogPage.css";

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

    // 끝에 도달하면 시작점 조정
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="audit-log-page">
      <h2>Audit Logs</h2>
      <p className="audit-log-page__description">
        Schedule, Club, ClubMember 변경 이력을 조회합니다.
      </p>

      <div className="audit-log-page__filters">
        {/* 클럽 검색 (로컬 필터링) */}
        <div className="club-search-wrapper">
          <input
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
            className={selectedClub ? "club-selected" : ""}
          />
          {selectedClub && (
            <button
              type="button"
              className="club-clear-btn"
              onClick={handleClearClub}
              title="선택 해제"
            >
              ✕
            </button>
          )}
          {showSuggestions && filteredClubs.length > 0 && (
            <div ref={suggestionsRef} className="club-suggestions">
              {filteredClubs.slice(0, 10).map((club) => (
                <div
                  key={club.id}
                  className="club-suggestion-item"
                  onClick={() => handleClubSelect(club)}
                >
                  <span className="club-suggestion-name">{club.name}</span>
                  {(club.regionDepth1 || club.regionDepth2) && (
                    <span className="club-suggestion-region">
                      {[club.regionDepth1, club.regionDepth2].filter(Boolean).join(" ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as AuditEntityType | "")}
        >
          <option value="">Entity Type (All)</option>
          <option value="SCHEDULE">SCHEDULE</option>
          <option value="SCHEDULE_PARTICIPANT">SCHEDULE_PARTICIPANT</option>
          <option value="MATCH">MATCH</option>
          <option value="CLUB">CLUB</option>
          <option value="CLUB_MEMBER">CLUB_MEMBER</option>
        </select>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value as AuditActionType | "")}
        >
          <option value="">Action Type (All)</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <button className="btn-primary" onClick={handleSearch}>
          조회
        </button>
      </div>

      {error && <div className="audit-log-page__error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : logs.length === 0 ? (
        <div className="audit-log-page__empty">
          <p>조회된 로그가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="audit-log-page__info">
            총 {totalElements}건 (페이지 {page + 1} / {totalPages})
            {selectedClub && (
              <span className="filter-info"> | 클럽: {selectedClub.name}</span>
            )}
          </div>
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Action</th>
                <th>User</th>
                <th>Club</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  className="audit-log-table__row--clickable"
                >
                  <td>{log.id}</td>
                  <td>{log.entityType}</td>
                  <td>{log.entityId}</td>
                  <td>
                    <span
                      className={`action-badge action-badge--${log.actionType.toLowerCase()}`}
                    >
                      {log.actionType}
                    </span>
                  </td>
                  <td>{log.userName || log.userId}</td>
                  <td>{log.clubName || log.clubId}</td>
                  <td>{formatShortDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 개선된 페이지네이션 */}
          <div className="audit-log-page__pagination">
            <button disabled={page === 0} onClick={() => setPage(0)}>
              «
            </button>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ‹
            </button>

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                className={pageNum === page ? "active" : ""}
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              »
            </button>
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
