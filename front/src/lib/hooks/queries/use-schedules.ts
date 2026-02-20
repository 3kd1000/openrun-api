import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchedulesByClubId,
  getScheduleById,
  getUpcomingSchedules,
  getSchedulesByDateRange,
  getSchedulesByCursor,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  updateSchedulePinned,
  updateGuestRecruit,
  updateInterclubRecruit,
  getPublicRecruitSchedules,
  getMySchedules,
} from "@/lib/api/schedule-service";
import type { CreateScheduleRequest } from "@/lib/types/schedule";
import { ensureArray } from "@/lib/utils/safe";

export const scheduleKeys = {
  all: ["schedules"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (clubId: number) => [...scheduleKeys.lists(), clubId] as const,
  upcoming: (clubId: number) =>
    [...scheduleKeys.all, "upcoming", clubId] as const,
  dateRange: (clubId: number, start: string, end: string) =>
    [...scheduleKeys.all, "dateRange", clubId, start, end] as const,
  cursor: (clubId: number, pivotDate: string, direction: string) =>
    [...scheduleKeys.all, "cursor", clubId, pivotDate, direction] as const,
  detail: (scheduleId: number) =>
    [...scheduleKeys.all, "detail", scheduleId] as const,
  recruit: (params: Record<string, unknown>) =>
    [...scheduleKeys.all, "recruit", params] as const,
  my: (upcoming?: boolean) =>
    [...scheduleKeys.all, "my", upcoming] as const,
};

export function useSchedulesByClub(clubId: number) {
  return useQuery({
    queryKey: scheduleKeys.list(clubId),
    queryFn: () => getSchedulesByClubId(clubId),
    select: ensureArray,
    enabled: clubId > 0,
  });
}

export function useScheduleDetail(scheduleId: number) {
  return useQuery({
    queryKey: scheduleKeys.detail(scheduleId),
    queryFn: () => getScheduleById(scheduleId),
    enabled: scheduleId > 0,
  });
}

export function useUpcomingSchedules(clubId: number) {
  return useQuery({
    queryKey: scheduleKeys.upcoming(clubId),
    queryFn: () => getUpcomingSchedules(clubId),
    select: ensureArray,
    enabled: clubId > 0,
  });
}

export function useSchedulesByDateRange(
  clubId: number,
  start: string,
  end: string
) {
  return useQuery({
    queryKey: scheduleKeys.dateRange(clubId, start, end),
    queryFn: () => getSchedulesByDateRange(clubId, start, end),
    select: ensureArray,
    enabled: clubId > 0 && !!start && !!end,
  });
}

export function useSchedulesByCursor(
  clubId: number,
  pivotDate: string,
  direction: "PAST" | "FUTURE" = "FUTURE",
  size: number = 20
) {
  return useQuery({
    queryKey: scheduleKeys.cursor(clubId, pivotDate, direction),
    queryFn: () => getSchedulesByCursor(clubId, pivotDate, direction, size),
    enabled: clubId > 0 && !!pivotDate,
  });
}

export function usePublicRecruitSchedules(params: {
  type?: "GUEST" | "INTERCLUB";
  matchType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: scheduleKeys.recruit(params),
    queryFn: () => getPublicRecruitSchedules(params),
    select: ensureArray,
  });
}

export function useMySchedules(upcoming?: boolean) {
  return useQuery({
    queryKey: scheduleKeys.my(upcoming),
    queryFn: () => getMySchedules(upcoming),
    select: ensureArray,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      data,
    }: {
      scheduleId: number;
      data: CreateScheduleRequest;
    }) => updateSchedule(scheduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) => deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateSchedulePinned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      pinned,
    }: {
      scheduleId: number;
      pinned: boolean;
    }) => updateSchedulePinned(scheduleId, pinned),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

export function useUpdateGuestRecruit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      open,
      note,
    }: {
      scheduleId: number;
      open: boolean;
      note?: string | null;
    }) => updateGuestRecruit(scheduleId, open, note),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

export function useUpdateInterclubRecruit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      open,
      note,
    }: {
      scheduleId: number;
      open: boolean;
      note?: string | null;
    }) => updateInterclubRecruit(scheduleId, open, note),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}
