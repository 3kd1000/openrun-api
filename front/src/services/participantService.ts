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
  joinSchedule: async (scheduleId: number): Promise<Participant> => {
    const response = await axiosInstance.post(`/schedules/${scheduleId}/participants`, null);
    return response.data;
  },

  // 참가 신청 취소
  cancelParticipation: async (scheduleId: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}/participants`);
  },

  // 특정 일정의 참가자 목록 조회
  getParticipants: async (scheduleId: number): Promise<Participant[]> => {
    const response = await axiosInstance.get(`/schedules/${scheduleId}/participants`);
    return response.data;
  },

  // 내 참가 신청 내역 조회
  // 백엔드에서 { data: Participant | null } 형태로 반환
  getMyParticipation: async (scheduleId: number): Promise<Participant | null> => {
    const response = await axiosInstance.get<{ data: Participant | null }>(
      `/schedules/${scheduleId}/participants/me`
    );
    return response.data.data; // Participant 또는 null
  },

  // 참가자 일괄 수정 (운영진 전용)
  bulkUpdateParticipants: async (
    scheduleId: number,
    userIds: number[]
  ): Promise<void> => {
    await axiosInstance.put(`/schedules/${scheduleId}/participants/bulk`,
      { userIds }
    );
  },

  // 일정 참가신청/취소 배치 처리
  batchParticipation: async (
    request: BatchParticipationRequest
  ): Promise<BatchParticipationResponse> => {
    const response = await axiosInstance.post<BatchParticipationResponse>(
      `/schedules/participants/batch`,
      request
    );
    return response.data;
  },

  // 게스트 참가자 추가
  addGuestParticipant: async (scheduleId: number, guestName: string): Promise<Participant> => {
    const response = await axiosInstance.post(`/schedules/${scheduleId}/participants/guests`, { guestName });
    return response.data;
  },

  // 게스트 참가자 삭제
  removeGuestParticipant: async (scheduleId: number, participantId: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}/participants/guests/${participantId}`);
  },

  // 게스트 이름 변경
  updateGuestName: async (scheduleId: number, participantId: number, guestName: string): Promise<void> => {
    await axiosInstance.patch(`/schedules/${scheduleId}/participants/guests/${participantId}/name`, { guestName });
  },

  // 공개일정 참가 신청
  requestJoinPublicSchedule: async (scheduleId: number): Promise<Participant> => {
    const response = await axiosInstance.post(`/schedules/${scheduleId}/participants/request`, null);
    return response.data;
  },

  // 참가자 승인 (호스트)
  approveParticipant: async (scheduleId: number, participantId: number): Promise<void> => {
    await axiosInstance.patch(`/schedules/${scheduleId}/participants/${participantId}/approve`, null);
  },

  // 참가자 거절 (호스트)
  rejectParticipant: async (scheduleId: number, participantId: number): Promise<void> => {
    await axiosInstance.patch(`/schedules/${scheduleId}/participants/${participantId}/reject`, null);
  },
};
