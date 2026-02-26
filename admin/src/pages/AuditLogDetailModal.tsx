import { useMemo } from "react";
import { parseChanges } from "../services/auditLogService";
import type { AuditLogResponse } from "../services/auditLogService";
import { formatFullDateTime, formatScheduleDateTime } from "../utils/dateUtils";
import {
  buildFrontendRoute,
  getFrontendLinkLabel,
} from "../utils/frontendLinkUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

  // Schedule 관련 정보 (API 응답에서 직접 사용)
  const scheduleInfo = useMemo(() => {
    if (log.entityType !== "SCHEDULE" && log.entityType !== "SCHEDULE_PARTICIPANT") {
      return null;
    }
    if (!log.scheduledAt && !log.courtName) return null;
    return {
      scheduledAt: log.scheduledAt
        ? formatScheduleDateTime(log.scheduledAt, log.durationMinutes ?? 120)
        : null,
      courtName: log.courtName || null,
    };
  }, [log.entityType, log.scheduledAt, log.courtName, log.durationMinutes]);

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

  const getActionBadge = () => {
    if (log.actionType === "CREATE") return <Badge>{getActionLabel()}</Badge>;
    if (log.actionType === "DELETE")
      return <Badge variant="destructive">{getActionLabel()}</Badge>;
    return <Badge variant="secondary">{getActionLabel()}</Badge>;
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

  const infoRows = [
    { label: "ID", value: String(log.id) },
    { label: "Action", value: getActionBadge() },
    { label: "Entity", value: `${log.entityType} #${log.entityId}` },
    { label: "User", value: `${log.userName ?? ""} (ID: ${log.userId})` },
    { label: "Club", value: `${log.clubName ?? ""} (ID: ${log.clubId})` },
    { label: "Time", value: formatFullDateTime(log.createdAt) },
    ...(scheduleInfo?.scheduledAt
      ? [{ label: "일정", value: scheduleInfo.scheduledAt }]
      : []),
    ...(scheduleInfo?.courtName
      ? [{ label: "코트", value: scheduleInfo.courtName }]
      : []),
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Audit Log 상세</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* 기본 정보 */}
            <div className="grid gap-2">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground font-medium">
                    {row.label}
                  </span>
                  <span className="break-all">
                    {typeof row.value === "string" ? row.value : row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 프론트엔드 링크 */}
            {frontendUrl && (
              <div>
                <a
                  href={frontendUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  🔗 {frontendLinkLabel}
                </a>
              </div>
            )}

            {/* 변경 내역 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">변경 내역</h4>

              {log.actionType === "CREATE" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">생성된 데이터</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(changes.after, null, 2)}
                  </pre>
                </div>
              )}

              {log.actionType === "DELETE" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">삭제된 데이터</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(changes.before, null, 2)}
                  </pre>
                </div>
              )}

              {log.actionType === "UPDATE" && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>필드</TableHead>
                        <TableHead>Before</TableHead>
                        <TableHead>After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allKeys.map((key) => (
                        <TableRow
                          key={key}
                          className={cn(isChanged(key) && "bg-yellow-50")}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {key}
                          </TableCell>
                          <TableCell className="text-xs">
                            <pre className="whitespace-pre-wrap break-all font-mono max-w-[200px]">
                              {formatValue(changes.before?.[key])}
                            </pre>
                          </TableCell>
                          <TableCell className="text-xs">
                            <pre className="whitespace-pre-wrap break-all font-mono max-w-[200px]">
                              {formatValue(changes.after?.[key])}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AuditLogDetailModal;
