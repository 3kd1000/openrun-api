import axiosInstance from './api/axiosInstance';
import type { Schedule, CreateScheduleRequest } from '../types/schedule';

export const scheduleService = {
  // 일정 생성
  createSchedule: async (data: CreateScheduleRequest): Promise<Schedule> => {
    const response = await axiosInstance.post('/schedules', data);
    return response.data;
  },

  // 모든 일정 조회
  getAllSchedules: async (): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules');
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
  getScheduleById: async (scheduleId: number): Promise<Schedule> => {
    const response = await axiosInstance.get(`/schedules/${scheduleId}`);
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
  }
};
