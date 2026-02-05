import axiosInstance from './api/axiosInstance';
import type { Schedule, CreateScheduleRequest } from '../types/schedule';

// 커서 기반 페이지네이션 응답 타입
export interface ScheduleCursorResponse {
  content: Schedule[];
  hasMore: boolean;
  nextCursor: string | null;  // ISO 8601 날짜 문자열
  size: number;
}

// 커서 조회 방향
export type CursorDirection = 'PAST' | 'FUTURE';

export const scheduleService = {
  // 일정 생성
  createSchedule: async (data: CreateScheduleRequest, userId?: number): Promise<Schedule> => {
    const response = await axiosInstance.post('/schedules', data, {
      params: userId ? { userId } : undefined
    });
    return response.data;
  },

  // 모든 일정 조회 (userId 필수, clubId 없으면 전체 조회는 관리자만 가능)
  getAllSchedules: async (userId: number, clubId?: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { userId, ...(clubId && { clubId }) }
    });
    return response.data;
  },

  // 특정 클럽의 일정 조회
  getSchedulesByClubId: async (userId: number, clubId: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { userId, clubId }
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
  getUpcomingSchedules: async (userId: number, clubId: number): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { userId, clubId, upcoming: true }
    });
    return response.data;
  },

  // 날짜 범위로 조회
  getSchedulesByDateRange: async (
    userId: number,
    clubId: number,
    start: string,
    end: string
  ): Promise<Schedule[]> => {
    const response = await axiosInstance.get('/schedules', {
      params: { userId, clubId, start, end }
    });
    return response.data;
  },

  // 일정 수정
  updateSchedule: async (scheduleId: number, data: CreateScheduleRequest, userId?: number): Promise<Schedule> => {
    const response = await axiosInstance.put(`/schedules/${scheduleId}`, data, {
      params: userId ? { userId } : undefined
    });
    return response.data;
  },

  // 일정 삭제
  deleteSchedule: async (scheduleId: number, userId?: number): Promise<void> => {
    await axiosInstance.delete(`/schedules/${scheduleId}`, {
      params: userId ? { userId } : undefined
    });
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

  /**
   * 커서 기반 페이지네이션 일정 조회 (Infinite Scroll용)
   * @param userId 사용자 ID
   * @param clubId 클럽 ID
   * @param pivotDate 기준 날짜 (ISO 8601 형식)
   * @param direction PAST(과거 방향) | FUTURE(미래 방향)
   * @param size 조회할 개수 (기본 30, 최대 50)
   */
  getSchedulesByCursor: async (
    userId: number,
    clubId: number,
    pivotDate: string,
    direction: CursorDirection = 'FUTURE',
    size: number = 30
  ): Promise<ScheduleCursorResponse> => {
    const response = await axiosInstance.get('/schedules/cursor', {
      params: { userId, clubId, pivotDate, direction, size }
    });
    return response.data;
  },
};
