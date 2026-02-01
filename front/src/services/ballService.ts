import axiosInstance from './api/axiosInstance';
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
} from '../types/ball';

export const ballService = {
  // 공용구 현황 조회
  getBallSummary: async (clubId: number): Promise<BallSummaryResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/balls`);
    return response.data;
  },

  // 거래 내역 조회 (페이징)
  getTransactions: async (
    clubId: number,
    page: number = 0,
    size: number = 20
  ): Promise<BallTransactionPageResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/balls/transactions`, {
      params: { page, size },
    });
    return response.data;
  },

  // 일정별 사용 내역 조회
  getScheduleUsages: async (
    clubId: number,
    scheduleId: number
  ): Promise<BallTransactionResponse[]> => {
    const response = await axiosInstance.get(
      `/clubs/${clubId}/balls/schedules/${scheduleId}/usages`
    );
    return response.data;
  },

  // 공용구 입고 (ADMIN+)
  addBalls: async (
    clubId: number,
    request: AddBallRequest
  ): Promise<BallTransactionResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/balls/add`, request);
    return response.data;
  },

  // 공용구 배분 (ADMIN+)
  distributeBalls: async (
    clubId: number,
    request: DistributeBallRequest
  ): Promise<BallTransactionResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/balls/distribute`, request);
    return response.data;
  },

  // 공용구 사용 기록 (본인 or ADMIN+)
  useBalls: async (
    clubId: number,
    request: UseBallRequest
  ): Promise<BallTransactionResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/balls/use`, request);
    return response.data;
  },

  // 보유자 지정/해제 (ADMIN+)
  updateBallKeeper: async (
    clubId: number,
    memberId: number,
    request: UpdateBallKeeperRequest
  ): Promise<void> => {
    await axiosInstance.put(`/clubs/${clubId}/balls/members/${memberId}/keeper`, request);
  },

  // 사용 기록 삭제 (본인 or ADMIN+)
  deleteTransaction: async (clubId: number, transactionId: number): Promise<void> => {
    await axiosInstance.delete(`/clubs/${clubId}/balls/transactions/${transactionId}`);
  },

  // 공용구 수량 조정 (ADMIN+)
  adjustQuantity: async (
    clubId: number,
    request: AdjustBallRequest
  ): Promise<BallTransactionResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/balls/adjust`, request);
    return response.data;
  },

  // 공용구 수량 일괄 조정 (ADMIN+)
  batchAdjustQuantities: async (
    clubId: number,
    request: BatchAdjustBallRequest
  ): Promise<void> => {
    await axiosInstance.post(`/clubs/${clubId}/balls/adjust/batch`, request);
  },
};
