import axiosInstance from "@/services/api/axiosInstance";
import { getOpenRunSession } from "@/utils/openrunSession";
import type { Participant, MyParticipationInfo } from "@/lib/types/schedule";

function getUserId(): number | undefined {
  return getOpenRunSession().userId;
}

export const joinSchedule = async (
  scheduleId: number
): Promise<Participant> => {
  const response = await axiosInstance.post<Participant>(
    `/schedules/${scheduleId}/participants`,
    null,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const cancelParticipation = async (
  scheduleId: number
): Promise<void> => {
  await axiosInstance.delete(`/schedules/${scheduleId}/participants`, {
    params: { userId: getUserId() },
  });
};

export const getParticipants = async (
  scheduleId: number
): Promise<Participant[]> => {
  const response = await axiosInstance.get<Participant[]>(
    `/schedules/${scheduleId}/participants`,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const getMyParticipation = async (
  scheduleId: number
): Promise<MyParticipationInfo | null> => {
  try {
    const response = await axiosInstance.get<MyParticipationInfo>(
      `/schedules/${scheduleId}/participants/me`,
      { params: { userId: getUserId() } }
    );
    return response.data;
  } catch {
    return null;
  }
};

export const bulkUpdateParticipants = async (
  scheduleId: number,
  userIds: number[]
): Promise<void> => {
  await axiosInstance.put(
    `/schedules/${scheduleId}/participants/bulk`,
    { userIds },
    { params: { userId: getUserId() } }
  );
};

export interface BatchParticipationRequest {
  selectedScheduleIds: number[];
}

export interface BatchParticipationResponse {
  joinedScheduleIds: number[];
  canceledScheduleIds: number[];
  failedOperations: { scheduleId: number; reason: string }[];
}

export const batchParticipation = async (
  request: BatchParticipationRequest
): Promise<BatchParticipationResponse> => {
  const response = await axiosInstance.post<BatchParticipationResponse>(
    "/schedules/participants/batch",
    request,
    { params: { userId: getUserId() } }
  );
  return response.data;
};
