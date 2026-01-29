import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "../services/auditLogService";
import type {
  AuditLogResponse,
  AuditEntityType,
  AuditActionType,
  PageResponse,
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, size: 20 };
      if (entityType) params.entityType = entityType;
      if (actionType) params.actionType = actionType;

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
  }, [page, entityType, actionType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  return (
    <div className="audit-log-page">
      <h2>Audit Logs</h2>
      <p className="audit-log-page__description">
        Schedule, Club, ClubMember 변경 이력을 조회합니다.
      </p>

      <div className="audit-log-page__filters">
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

          <div className="audit-log-page__pagination">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
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
