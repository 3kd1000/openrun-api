import { useEffect, useState, useCallback } from "react";
import {
  getBatchHistory,
  executeBatchJob,
  type BatchHistoryResponse,
  type BatchJobStatus,
  type PageResponse,
} from "../services/batchHistoryService";
import { formatDateTimeShortKST } from "../utils/dateTimeUtils";
import "./BatchPage.css";

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
    canExecute: false,  // 노드 레벨 작업이라 API에서 실행 불가
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

    const confirmed = window.confirm(`"${getJobDisplayName(jobName)}" 배치를 즉시 실행하시겠습니까?`);
    if (!confirmed) return;

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
        return <span className="batch-status batch-status--success">성공</span>;
      case "FAILED":
        return <span className="batch-status batch-status--failed">실패</span>;
      case "RUNNING":
        return <span className="batch-status batch-status--running">실행중</span>;
      default:
        return <span className="batch-status">{status}</span>;
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
    <div className="batch-page">
      <h2>배치 작업 관리</h2>
      <p className="batch-page__description">
        정기적으로 실행되는 배치 작업을 관리하고 수동 실행할 수 있습니다.
      </p>

      {/* 배치 작업 목록 */}
      <section className="batch-jobs-section">
        <h3>배치 작업 목록</h3>
        <div className="batch-jobs-grid">
          {BATCH_JOBS.map((job) => (
            <div key={job.name} className="batch-job-card">
              <div className="batch-job-card__header">
                <h4>{job.displayName}</h4>
                {job.canExecute ? (
                  <button
                    className="batch-execute-btn"
                    onClick={() => handleExecute(job.name)}
                    disabled={executing !== null}
                  >
                    {executing === job.name ? "실행중..." : "즉시 실행"}
                  </button>
                ) : (
                  <span className="batch-external-badge">외부 실행</span>
                )}
              </div>
              <p className="batch-job-card__description">{job.description}</p>
              <div className="batch-job-card__schedule">
                <span className="schedule-label">예약:</span> {job.schedule}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 실행 이력 */}
      <section className="batch-history-section">
        <div className="batch-history-header">
          <h3>실행 이력</h3>
          <button className="batch-refresh-btn" onClick={() => loadHistory(currentPage)} disabled={loading}>
            새로고침
          </button>
        </div>

        {loading && <div className="batch-loading">로딩 중...</div>}

        {error && <div className="batch-error">{error}</div>}

        {!loading && history && (
          <>
            <table className="batch-history-table">
              <thead>
                <tr>
                  <th>작업명</th>
                  <th>상태</th>
                  <th>시작 시각</th>
                  <th>소요 시간</th>
                  <th>결과</th>
                </tr>
              </thead>
              <tbody>
                {history.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="batch-empty">
                      실행 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  history.content.map((item) => {
                    const summary = parseResultSummary(item.resultSummary);
                    return (
                      <tr key={item.id} className={item.status === "FAILED" ? "row-failed" : ""}>
                        <td>{getJobDisplayName(item.jobName)}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>{formatDateTimeShortKST(item.startedAt)}</td>
                        <td>{formatDuration(item.durationMs)}</td>
                        <td className="result-cell">
                          {item.errorMessage ? (
                            <span className="error-text">{item.errorMessage}</span>
                          ) : summary ? (
                            <div className="summary-items">
                              {Object.entries(summary).map(([key, value]) => (
                                <span key={key} className="summary-item">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {history.totalPages > 1 && (
              <div className="batch-pagination">
                <button
                  onClick={() => loadHistory(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  이전
                </button>
                <span className="page-info">
                  {currentPage + 1} / {history.totalPages}
                </span>
                <button
                  onClick={() => loadHistory(currentPage + 1)}
                  disabled={currentPage >= history.totalPages - 1}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default BatchPage;
