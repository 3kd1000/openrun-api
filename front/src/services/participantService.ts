import axiosInstance from './api/axiosInstance';
import type { Participant } from '../types/schedule';

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
  getMyParticipation: async (scheduleId: number, userId: number): Promise<Participant | null> => {
    try {
      const response = await axiosInstance.get(`/schedules/${scheduleId}/participants/me`, {
        params: { userId }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
};
