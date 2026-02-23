import { useEffect, useState, useCallback } from "react";
import {
  getBatchHistory,
  executeBatchJob,
  type BatchHistoryResponse,
  type BatchJobStatus,
  type PageResponse,
} from "../services/batchHistoryService";
import { formatShortDateTime } from "../utils/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// 배치 작업 정의
const BATCH_JOBS = [
  {
    name: "SCHEDULE_MAINTENANCE",
    displayName: "일정 유지보수",
    description: "과거 일정의 고정/게스트모집/교류전모집 플래그 OFF + 클럽 활동 요약 업데이트",
    schedule: "매일 새벽 3시 (KST)",
    canExecute: true,
  },
  {
    name: "AUDIT_LOG_CLEANUP",
    displayName: "감사 로그 정리",
    description: "2년 이상 된 감사 로그 삭제",
    schedule: "매일 새벽 3시 30분 (KST)",
    canExecute: true,
  },
  {
    name: "DAILY_STATS_COLLECT",
    displayName: "일별 통계 수집",
    description: "전날 기준 사용자/클럽 통계 수집 (DAU, WAU, MAU, 신규가입 등)",
    schedule: "매일 자정 5분 (KST)",
    canExecute: true,
  },
  {
    name: "IMAGE_CLEANUP",
    displayName: "이미지 정리",
    description: "K8s containerd 이미지 정리 (openrun 이미지 최근 3개만 유지)",
    schedule: "매일 새벽 3시 (KST)",
    canExecute: false, // 노드 레벨 작업이라 API에서 실행 불가
  },
];

function BatchPage() {
  const [history, setHistory] = useState<PageResponse<BatchHistoryResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const loadHistory = useCallback(async (page: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBatchHistory(page, 10);
      setHistory(data);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load batch history:", err);
      setError("배치 이력을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleExecute = async (jobName: string) => {
    if (executing) return;

    try {
      setExecuting(jobName);
      const result = await executeBatchJob(jobName);
      if (result.status === "success") {
        alert(result.message);
        // 이력 새로고침
        await loadHistory(0);
      } else {
        alert(`실행 실패: ${result.message}`);
      }
    } catch (err) {
      console.error("Failed to execute batch:", err);
      alert("배치 실행 중 오류가 발생했습니다.");
    } finally {
      setExecuting(null);
    }
  };

  const getStatusBadge = (status: BatchJobStatus) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
            성공
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            실패
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
            실행중
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (durationMs: number | null): string => {
    if (durationMs === null) return "-";
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  const getJobDisplayName = (jobName: string): string => {
    const job = BATCH_JOBS.find((j) => j.name === jobName);
    return job?.displayName || jobName;
  };

  const parseResultSummary = (summary: string | null): Record<string, number> | null => {
    if (!summary) return null;
    try {
      return JSON.parse(summary);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">배치 작업 관리</h2>
        <p className="text-muted-foreground mt-1">
          정기적으로 실행되는 배치 작업을 관리하고 수동 실행할 수 있습니다.
        </p>
      </div>

      {/* 배치 작업 목록 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">배치 작업 목록</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BATCH_JOBS.map((job) => (
            <Card key={job.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base font-semibold">{job.displayName}</CardTitle>
                  {job.canExecute ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          disabled={executing !== null}
                          className="shrink-0"
                        >
                          {executing === job.name ? "실행중..." : "즉시 실행"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>배치 즉시 실행</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{job.displayName}" 배치를 즉시 실행하시겠습니까?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleExecute(job.name)}>
                            실행
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                      외부 실행
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{job.description}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">예약:</span> {job.schedule}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 실행 이력 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">실행 이력</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadHistory(currentPage)}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
        )}

        {error && (
          <div className="py-8 text-center text-destructive">{error}</div>
        )}

        {!loading && history && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>작업명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>시작 시각</TableHead>
                    <TableHead>소요 시간</TableHead>
                    <TableHead>결과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.content.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        실행 이력이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.content.map((item) => {
                      const summary = parseResultSummary(item.resultSummary);
                      return (
                        <TableRow
                          key={item.id}
                          className={item.status === "FAILED" ? "bg-red-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {getJobDisplayName(item.jobName)}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatShortDateTime(item.startedAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDuration(item.durationMs)}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            {item.errorMessage ? (
                              <span className="text-xs text-red-800 break-all">
                                {item.errorMessage}
                              </span>
                            ) : summary ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(summary).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded"
                                  >
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {history.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadHistory(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {history.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadHistory(currentPage + 1)}
                  disabled={currentPage >= history.totalPages - 1}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default BatchPage;
