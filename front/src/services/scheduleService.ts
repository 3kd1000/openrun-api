import axiosInstance from './api/axiosInstance';
import type { Schedule, CreateScheduleRequest } from '../types/schedule';

export const scheduleService = {
  // 일정 생성
  createSchedule: async (data: CreateScheduleRequest): Promise<Schedule> => {
    const response = await axiosInstance.post('/schedules', data);
    return response.data;
  },

  // 모든 일정 조회 (clubId 없으면 전체, 있으면 해당 클럽만)
  getAllSchedules: async (clubId?: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: clubId ? { clubId } : undefined
    });
    return response.data;
  },

  // 특정 클럽의 일정 조회
  getSchedulesByClubId: async (clubId: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { clubId }
    });
    return response.data;
  },

  // 특정 일정 조회
  getScheduleById: async (scheduleId: number, userId?: number): Promise<Schedule> => {
    const response = await axiosInstance.get(`/schedules/${scheduleId}`, {
      params: userId ? { userId } : undefined
    });
    return response.data;
  },

  // 향후 일정 조회
  getUpcomingSchedules: async (clubId: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { clubId, upcoming: true }
    });
    return response.data;
  },

  // 날짜 범위로 조회
  getSchedulesByDateRange: async (
    clubId: number,
    start: string,
    end: string
  ): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { clubId, start, end }
    });
    return response.data;
  },

  // 일정 수정
  updateSchedule: async (scheduleId: number, data: CreateScheduleRequest): Promise<Schedule> => {
    const response = await axiosInstance.put(`/schedules/${scheduleId}`, data);
    return response.data;
  },

  // 일정 삭제
  deleteSchedule: async (scheduleId: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}`);
  },

  // 내가 참여한 일정 ID 목록 조회
  getMyParticipations: async (userId: number): Promise<number[]> => {
    const response = await axiosInstance.get('/schedules/my-participations', {
      params: { userId }
    });
    return response.data;
  },

  // 대진표 삭제
  deleteDraw: async (scheduleId: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}/draw`);
  },

  // 일정 PIN 설정/해제 (운영진 이상)
  updateSchedulePinned: async (
    scheduleId: number,
    pinned: boolean,
    userId: number
  ): Promise<Schedule> => {
    const response = await axiosInstance.patch(`/schedules/${scheduleId}/pinned`, { pinned }, {
      params: { userId },
    });
    return response.data;
  },

  // 게스트 모집 설정 (운영진 이상)
  updateGuestRecruit: async (
    scheduleId: number,
    open: boolean,
    userId: number,
    note?: string | null
  ): Promise<Schedule> => {
    const response = await axiosInstance.patch(`/schedules/${scheduleId}/guest-recruit`, { open, note: note ?? null }, {
      params: { userId },
    });
    return response.data;
  },

  // 교류전 모집 설정 (운영진 이상)
  updateInterclubRecruit: async (
    scheduleId: number,
    open: boolean,
    userId: number,
    note?: string | null
  ): Promise<Schedule> => {
    const response = await axiosInstance.patch(`/schedules/${scheduleId}/interclub-recruit`, { open, note: note ?? null }, {
      params: { userId },
    });
    return response.data;
  },
};
