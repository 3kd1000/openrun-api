import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getParticipants,
  getMyParticipation,
  joinSchedule,
  cancelParticipation,
  bulkUpdateParticipants,
  batchParticipation,
  type BatchParticipationRequest,
} from "@/lib/api/participant-service";
import { getMyParticipations } from "@/lib/api/schedule-service";
import { scheduleKeys } from "./use-schedules";
import { ensureArray } from "@/lib/utils/safe";

export const participantKeys = {
  all: ["participants"] as const,
  list: (scheduleId: number) =>
    [...participantKeys.all, "list", scheduleId] as const,
  my: (scheduleId: number) =>
    [...participantKeys.all, "my", scheduleId] as const,
  myScheduleIds: () =>
    [...participantKeys.all, "myScheduleIds"] as const,
};

export function useParticipants(scheduleId: number) {
  return useQuery({
    queryKey: participantKeys.list(scheduleId),
    queryFn: () => getParticipants(scheduleId),
    select: ensureArray,
    enabled: scheduleId > 0,
  });
}

export function useMyParticipation(scheduleId: number) {
  return useQuery({
    queryKey: participantKeys.my(scheduleId),
    queryFn: () => getMyParticipation(scheduleId),
    enabled: scheduleId > 0,
  });
}

/** 내가 참가신청한 일정 ID 목록 */
export function useMyParticipatingScheduleIds() {
  return useQuery({
    queryKey: participantKeys.myScheduleIds(),
    queryFn: getMyParticipations,
    select: ensureArray,
  });
}

export function useJoinSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) => joinSchedule(scheduleId),
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({
        queryKey: participantKeys.list(scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: participantKeys.my(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: participantKeys.myScheduleIds() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useCancelParticipation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) => cancelParticipation(scheduleId),
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({
        queryKey: participantKeys.list(scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: participantKeys.my(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: participantKeys.myScheduleIds() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

/** 참가자 일괄 수정 (관리자용) */
export function useBulkUpdateParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      userIds,
    }: {
      scheduleId: number;
      userIds: number[];
    }) => bulkUpdateParticipants(scheduleId, userIds),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({
        queryKey: participantKeys.list(scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

/** 빠른 신청 - 배치 참가신청/취소 */
export function useBatchParticipation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BatchParticipationRequest) =>
      batchParticipation(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.all });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
