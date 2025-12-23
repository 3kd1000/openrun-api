import axiosInstance from './api/axiosInstance';

export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
}

export const userService = {
  // 게스트 사용자 목록 조회 (게스트1~16)
  getGuestUsers: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get('/users/guests');
    return response.data;
  }
};
