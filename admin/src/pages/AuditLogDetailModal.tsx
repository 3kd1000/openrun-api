import { useMemo } from "react";
import { parseChanges } from "../services/auditLogService";
import type { AuditLogResponse } from "../services/auditLogService";
import { formatFullDateTime } from "../utils/dateUtils";
import {
  buildFrontendRoute,
  getFrontendLinkLabel,
} from "../utils/frontendLinkUtils";
import "./AuditLogDetailModal.css";

interface Props {
  log: AuditLogResponse;
  onClose: () => void;
}

function AuditLogDetailModal({ log, onClose }: Props) {
  const changes = useMemo(() => parseChanges(log.changes), [log.changes]);

  const frontendUrl = useMemo(
    () => buildFrontendRoute(log.entityType, log.entityId, log.clubId, log.changes),
    [log.entityType, log.entityId, log.clubId, log.changes]
  );

  const frontendLinkLabel = useMemo(
    () => getFrontendLinkLabel(log.entityType),
    [log.entityType]
  );

  // Schedule 관련 정보 추출 (SCHEDULE, SCHEDULE_PARTICIPANT 모두)
  const scheduleInfo = useMemo(() => {
    if (log.entityType !== "SCHEDULE" && log.entityType !== "SCHEDULE_PARTICIPANT") {
      return null;
    }

    // 데이터 소스: after (CREATE/UPDATE) 또는 before (DELETE)
    const data = changes.after || changes.before;
    if (!data) return null;

    const scheduledAt = data.scheduledAt as string | undefined;
    const courtName = data.courtName as string | undefined;
    const scheduleId = data.scheduleId as number | undefined;

    if (!scheduledAt && !courtName) return null;

    return {
      scheduleId: log.entityType === "SCHEDULE_PARTICIPANT" ? scheduleId : log.entityId,
      scheduledAt: scheduledAt ? formatFullDateTime(scheduledAt) : null,
      courtName: courtName || null,
    };
  }, [log.entityType, log.entityId, changes]);

  const getActionLabel = () => {
    switch (log.actionType) {
      case "CREATE":
        return "생성";
      case "UPDATE":
        return "수정";
      case "DELETE":
        return "삭제";
      default:
        return log.actionType;
    }
  };

  const allKeys = useMemo(() => {
    const beforeKeys = Object.keys(changes.before || {});
    const afterKeys = Object.keys(changes.after || {});
    return [...new Set([...beforeKeys, ...afterKeys])];
  }, [changes]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const isChanged = (key: string): boolean => {
    const beforeVal = changes.before?.[key];
    const afterVal = changes.after?.[key];
    return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Audit Log 상세</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="audit-detail__info">
            <div className="audit-detail__row">
              <span className="audit-detail__label">ID:</span>
              <span>{log.id}</span>
            </div>
            <div className="audit-detail__row">
              <span className="audit-detail__label">Action:</span>
              <span
                className={`action-badge action-badge--${log.actionType.toLowerCase()}`}
              >
                {getActionLabel()}
              </span>
            </div>
            <div className="audit-detail__row">
              <span className="audit-detail__label">Entity:</span>
              <span>
                {log.entityType} #{log.entityId}
              </span>
            </div>
            <div className="audit-detail__row">
              <span className="audit-detail__label">User:</span>
              <span>
                {log.userName} (ID: {log.userId})
              </span>
            </div>
            <div className="audit-detail__row">
              <span className="audit-detail__label">Club:</span>
              <span>
                {log.clubName} (ID: {log.clubId})
              </span>
            </div>
            <div className="audit-detail__row">
              <span className="audit-detail__label">Time:</span>
              <span>{formatFullDateTime(log.createdAt)}</span>
            </div>
            {/* Schedule 관련 정보 (상단 정보에 포함) */}
            {scheduleInfo?.scheduledAt && (
              <div className="audit-detail__row">
                <span className="audit-detail__label">일정:</span>
                <span>{scheduleInfo.scheduledAt}</span>
              </div>
            )}
            {scheduleInfo?.courtName && (
              <div className="audit-detail__row">
                <span className="audit-detail__label">코트:</span>
                <span>{scheduleInfo.courtName}</span>
              </div>
            )}
          </div>

          {frontendUrl && (
            <div className="audit-detail__link-section">
              <a
                href={frontendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="audit-detail__link-btn"
              >
                🔗 {frontendLinkLabel}
              </a>
            </div>
          )}

          <h4 className="audit-detail__section-title">변경 내역</h4>

          {log.actionType === "CREATE" && (
            <div className="audit-detail__single">
              <h5>생성된 데이터</h5>
              <pre className="audit-detail__json">
                {JSON.stringify(changes.after, null, 2)}
              </pre>
            </div>
          )}

          {log.actionType === "DELETE" && (
            <div className="audit-detail__single">
              <h5>삭제된 데이터</h5>
              <pre className="audit-detail__json">
                {JSON.stringify(changes.before, null, 2)}
              </pre>
            </div>
          )}

          {log.actionType === "UPDATE" && (
            <div className="audit-detail__comparison">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>필드</th>
                    <th>Before</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeys.map((key) => (
                    <tr
                      key={key}
                      className={
                        isChanged(key) ? "comparison-table__row--changed" : ""
                      }
                    >
                      <td className="comparison-table__key">{key}</td>
                      <td className="comparison-table__value">
                        <pre>{formatValue(changes.before?.[key])}</pre>
                      </td>
                      <td className="comparison-table__value">
                        <pre>{formatValue(changes.after?.[key])}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogDetailModal;
