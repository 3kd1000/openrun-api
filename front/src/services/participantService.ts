import axiosInstance from './api/axiosInstance';
import type { Participant } from '../types/schedule';

// 배치 참가신청/취소 요청 타입
// 최종적으로 참가하고 싶은 일정 ID 목록만 전송
export interface BatchParticipationRequest {
  selectedScheduleIds: number[];
}

// 배치 참가신청/취소 응답 타입
export interface BatchParticipationResponse {
  joinedScheduleIds: number[];
  canceledScheduleIds: number[];
  failedOperations: {
    scheduleId: number;
    operation: 'JOIN' | 'CANCEL';
    errorMessage: string;
  }[];
}

export const participantService = {
  // 일정 참가 신청
  joinSchedule: async (scheduleId: number, userId: number): Promise<Participant> => {
    const response = await axiosInstance.post(`/schedules/${scheduleId}/participants`, null, {
      params: { userId }
    });
    return response.data;
  },

  // 참가 신청 취소
  cancelParticipation: async (scheduleId: number, userId: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}/participants`, {
      params: { userId }
    });
  },

  // 특정 일정의 참가자 목록 조회
  getParticipants: async (scheduleId: number): Promise<Participant[]> => {
    const response = await axiosInstance.get(`/schedules/${scheduleId}/participants`);
    return response.data;
  },

  // 내 참가 신청 내역 조회
  // 백엔드에서 { data: Participant | null } 형태로 반환
  getMyParticipation: async (scheduleId: number, userId: number): Promise<Participant | null> => {
    const response = await axiosInstance.get<{ data: Participant | null }>(
      `/schedules/${scheduleId}/participants/me`,
      { params: { userId } }
    );
    return response.data.data; // Participant 또는 null
  },

  // 참가자 일괄 수정 (운영진 전용)
  bulkUpdateParticipants: async (
    scheduleId: number,
    userIds: number[],
    userId: number
  ): Promise<void> => {
    await axiosInstance.put(`/schedules/${scheduleId}/participants/bulk`,
      { userIds },
      { params: { userId } }
    );
  },

  // 일정 참가신청/취소 배치 처리
  batchParticipation: async (
    userId: number,
    request: BatchParticipationRequest
  ): Promise<BatchParticipationResponse> => {
    const response = await axiosInstance.post<BatchParticipationResponse>(
      `/schedules/participants/batch`,
      request,
      { params: { userId } }
    );
    return response.data;
  }
};
