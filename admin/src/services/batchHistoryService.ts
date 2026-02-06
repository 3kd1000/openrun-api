import api from "./api";

/**
 * 배치 작업 상태
 */
export type BatchJobStatus = "RUNNING" | "SUCCESS" | "FAILED";

/**
 * 배치 작업 이력 응답 타입
 */
export interface BatchHistoryResponse {
  id: number;
  jobName: string;
  status: BatchJobStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  resultSummary: string | null;
  errorMessage: string | null;
}

/**
 * 페이징 응답 타입
 */
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/**
 * 각 작업별 최근 실행 결과 조회 (대시보드용)
 */
export async function getLatestBatchJobs(): Promise<BatchHistoryResponse[]> {
  const { data } = await api.get<BatchHistoryResponse[]>("/admin/batch/latest");
  return data;
}

/**
 * 전체 배치 이력 조회 (페이징)
 */
export async function getBatchHistory(
  page: number = 0,
  size: number = 20
): Promise<PageResponse<BatchHistoryResponse>> {
  const { data } = await api.get<PageResponse<BatchHistoryResponse>>(
    "/admin/batch/history",
    { params: { page, size } }
  );
  return data;
}

/**
 * 특정 작업의 최근 이력 조회
 */
export async function getRecentBatchHistory(
  jobName: string
): Promise<BatchHistoryResponse[]> {
  const { data } = await api.get<BatchHistoryResponse[]>(
    `/admin/batch/recent/${jobName}`
  );
  return data;
}

/**
 * 배치 작업 실행 응답 타입
 */
export interface ExecuteResponse {
  status: "success" | "error";
  message: string;
}

/**
 * 배치 작업 수동 실행
 */
export async function executeBatchJob(jobName: string): Promise<ExecuteResponse> {
  const { data } = await api.post<ExecuteResponse>(`/admin/batch/execute/${jobName}`);
  return data;
}
