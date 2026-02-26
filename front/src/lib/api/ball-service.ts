import axiosInstance from "@/services/api/axiosInstance";
import type {
  BallSummaryResponse,
  BallTransactionPageResponse,
  BallTransactionResponse,
  AddBallRequest,
  DistributeBallRequest,
  UseBallRequest,
  UpdateBallKeeperRequest,
  AdjustBallRequest,
  BatchAdjustBallRequest,
} from "@/lib/types/ball";

export const getBallSummary = async (
  clubId: number
): Promise<BallSummaryResponse> => {
  const response = await axiosInstance.get<BallSummaryResponse>(
    `/clubs/${clubId}/balls`
  );
  return response.data;
};

export const getTransactions = async (
  clubId: number,
  page: number = 0,
  size: number = 20
): Promise<BallTransactionPageResponse> => {
  const response = await axiosInstance.get<BallTransactionPageResponse>(
    `/clubs/${clubId}/balls/transactions`,
    { params: { page, size } }
  );
  return response.data;
};

export const getScheduleUsages = async (
  clubId: number,
  scheduleId: number
): Promise<BallTransactionResponse[]> => {
  const response = await axiosInstance.get<BallTransactionResponse[]>(
    `/clubs/${clubId}/balls/schedules/${scheduleId}/usages`
  );
  return response.data;
};

export const addBalls = async (
  clubId: number,
  request: AddBallRequest
): Promise<BallTransactionResponse> => {
  const response = await axiosInstance.post<BallTransactionResponse>(
    `/clubs/${clubId}/balls/add`,
    request
  );
  return response.data;
};

export const distributeBalls = async (
  clubId: number,
  request: DistributeBallRequest
): Promise<BallTransactionResponse> => {
  const response = await axiosInstance.post<BallTransactionResponse>(
    `/clubs/${clubId}/balls/distribute`,
    request
  );
  return response.data;
};

export const useBalls = async (
  clubId: number,
  request: UseBallRequest
): Promise<BallTransactionResponse> => {
  const response = await axiosInstance.post<BallTransactionResponse>(
    `/clubs/${clubId}/balls/use`,
    request
  );
  return response.data;
};

export const updateBallKeeper = async (
  clubId: number,
  memberId: number,
  request: UpdateBallKeeperRequest
): Promise<void> => {
  await axiosInstance.put(
    `/clubs/${clubId}/balls/members/${memberId}/keeper`,
    request
  );
};

export const deleteTransaction = async (
  clubId: number,
  transactionId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/clubs/${clubId}/balls/transactions/${transactionId}`
  );
};

export const adjustQuantity = async (
  clubId: number,
  request: AdjustBallRequest
): Promise<BallTransactionResponse> => {
  const response = await axiosInstance.post<BallTransactionResponse>(
    `/clubs/${clubId}/balls/adjust`,
    request
  );
  return response.data;
};

export const batchAdjustQuantities = async (
  clubId: number,
  request: BatchAdjustBallRequest
): Promise<void> => {
  await axiosInstance.post(`/clubs/${clubId}/balls/adjust/batch`, request);
};
