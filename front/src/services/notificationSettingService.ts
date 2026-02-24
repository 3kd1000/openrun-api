import axiosInstance from "./api/axiosInstance";

export interface NotificationSettings {
  notiSchedule: boolean;
  notiClub: boolean;
  notiMessage: boolean;
  notiSystem: boolean;
}

export const notificationSettingService = {
  getSettings: async (): Promise<NotificationSettings> => {
    const response = await axiosInstance.get<NotificationSettings>("/notification-settings");
    return response.data;
  },

  updateSettings: async (data: NotificationSettings): Promise<NotificationSettings> => {
    const response = await axiosInstance.put<NotificationSettings>("/notification-settings", data);
    return response.data;
  },
};
