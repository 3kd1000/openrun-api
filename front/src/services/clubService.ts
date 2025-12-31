import axiosInstance from './api/axiosInstance';
import type { UserResponse } from './userService';

export const clubService = {
  // 클럽 회원 목록 조회 (ACTIVE 상태만)
  getClubMembers: async (clubId: number): Promise<UserResponse[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/members`, {
      params: { status: 'ACTIVE' }
    });
    return response.data;
  }
};
