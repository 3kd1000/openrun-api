import axiosInstance from "./api/axiosInstance";

export interface CalendarConnectionItem {
  id: number;
  provider: "GOOGLE" | "KAKAO";
  externalEmail: string | null;
  active: boolean;
  tokenExpired: boolean;
  createdAt: string;
}

export interface CalendarStatusResponse {
  connections: CalendarConnectionItem[];
}

export const calendarService = {
  getStatus: async (): Promise<CalendarStatusResponse> => {
    const response = await axiosInstance.get<CalendarStatusResponse>("/calendar/status");
    return response.data;
  },

  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await axiosInstance.get<string>("/calendar/google/auth-url");
    return response.data;
  },

  getKakaoAuthUrl: async (): Promise<string> => {
    const response = await axiosInstance.get<string>("/calendar/kakao/auth-url");
    return response.data;
  },

  disconnect: async (provider: "GOOGLE" | "KAKAO"): Promise<void> => {
    await axiosInstance.delete(`/calendar/${provider}`);
  },
};
