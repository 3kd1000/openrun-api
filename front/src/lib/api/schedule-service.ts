import axiosInstance from "@/services/api/axiosInstance";
import { getOpenRunSession } from "@/utils/openrunSession";
import type {
  Schedule,
  CreateScheduleRequest,
  ScheduleCursorResponse,
  PublicRecruitSchedule,
  MyScheduleResponse,
} from "@/lib/types/schedule";

/** 세션에서 userId 가져오기 (백엔드 필수 파라미터) */
function getUserId(): number | undefined {
  return getOpenRunSession().userId;
}

/** 날짜 문자열을 LocalDateTime 형식으로 변환 (백엔드 @DateTimeFormat(ISO.DATE_TIME)) */
function toLocalDateTime(dateStr: string): string {
  // 이미 T가 포함되어 있으면 그대로 반환
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00`;
}

export const createSchedule = async (
  data: CreateScheduleRequest
): Promise<Schedule> => {
  const response = await axiosInstance.post<Schedule>("/schedules", data, {
    params: { userId: getUserId() },
  });
  return response.data;
};

export const getSchedulesByClubId = async (
  clubId: number
): Promise<Schedule[]> => {
  const response = await axiosInstance.get<Schedule[]>("/schedules", {
    params: { clubId, userId: getUserId() },
  });
  return response.data;
};

export const getScheduleById = async (
  scheduleId: number
): Promise<Schedule> => {
  const response = await axiosInstance.get<Schedule>(
    `/schedules/${scheduleId}`,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const getUpcomingSchedules = async (
  clubId: number
): Promise<Schedule[]> => {
  const response = await axiosInstance.get<Schedule[]>("/schedules", {
    params: { clubId, upcoming: true, userId: getUserId() },
  });
  return response.data;
};

export const getSchedulesByDateRange = async (
  clubId: number,
  start: string,
  end: string
): Promise<Schedule[]> => {
  const response = await axiosInstance.get<Schedule[]>("/schedules", {
    params: {
      clubId,
      start: toLocalDateTime(start),
      end: toLocalDateTime(end),
      userId: getUserId(),
    },
  });
  return response.data;
};

export const updateSchedule = async (
  scheduleId: number,
  data: CreateScheduleRequest
): Promise<Schedule> => {
  const response = await axiosInstance.put<Schedule>(
    `/schedules/${scheduleId}`,
    data,
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const deleteSchedule = async (scheduleId: number): Promise<void> => {
  await axiosInstance.delete(`/schedules/${scheduleId}`, {
    params: { userId: getUserId() },
  });
};

export const getMyParticipations = async (): Promise<number[]> => {
  const response = await axiosInstance.get<number[]>(
    "/schedules/my-participations",
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const getSchedulesByCursor = async (
  clubId: number,
  pivotDate: string,
  direction: "PAST" | "FUTURE" = "FUTURE",
  size: number = 20
): Promise<ScheduleCursorResponse> => {
  const response = await axiosInstance.get<ScheduleCursorResponse>(
    "/schedules/cursor",
    {
      params: {
        clubId,
        pivotDate: toLocalDateTime(pivotDate),
        direction,
        size,
        userId: getUserId(),
      },
    }
  );
  return response.data;
};

export const updateSchedulePinned = async (
  scheduleId: number,
  pinned: boolean
): Promise<Schedule> => {
  const response = await axiosInstance.patch<Schedule>(
    `/schedules/${scheduleId}/pinned`,
    { pinned },
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const updateGuestRecruit = async (
  scheduleId: number,
  open: boolean,
  note?: string | null
): Promise<Schedule> => {
  const response = await axiosInstance.patch<Schedule>(
    `/schedules/${scheduleId}/guest-recruit`,
    { open, note },
    { params: { userId: getUserId() } }
  );
  return response.data;
};

export const updateInterclubRecruit = async (
  scheduleId: number,
  open: boolean,
  note?: string | null
): Promise<Schedule> => {
  const response = await axiosInstance.patch<Schedule>(
    `/schedules/${scheduleId}/interclub-recruit`,
    { open, note },
    { params: { userId: getUserId() } }
  );
  return response.data;
};

/** 내 일정 조회 */
export const getMySchedules = async (
  upcoming?: boolean
): Promise<MyScheduleResponse[]> => {
  const response = await axiosInstance.get<MyScheduleResponse[]>(
    "/users/me/schedules",
    { params: upcoming !== undefined ? { upcoming } : undefined }
  );
  return response.data;
};

/** 공개 모집 일정 조회 (인증 불필요) */
export const getPublicRecruitSchedules = async (params: {
  type?: "GUEST" | "INTERCLUB";
  matchType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<PublicRecruitSchedule[]> => {
  const response = await axiosInstance.get<PublicRecruitSchedule[]>(
    "/schedules/recruit",
    { params }
  );
  return response.data;
};
