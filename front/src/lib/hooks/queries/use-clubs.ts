import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createClub,
  updateClub,
  getClub,
  getClubMembers,
  getRecruitingClubs,
  getClubNotices,
  getClubRules,
  getClubContentUnreadCount,
  updateClubPolicy,
  updateMemberRoles,
  kickMember,
  joinClub,
  type UpdateMemberRolesRequest,
} from "@/lib/api/club-service";
import type {
  CreateClubRequest,
  UpdateClubRequest,
  UpdateClubPolicyRequest,
} from "@/lib/types/club";
import { ensureArray } from "@/lib/utils/safe";

export const clubKeys = {
  all: ["clubs"] as const,
  recruiting: () => [...clubKeys.all, "recruiting"] as const,
  members: (clubId: number) =>
    [...clubKeys.all, "members", clubId] as const,
  detail: (clubId: number) =>
    [...clubKeys.all, "detail", clubId] as const,
  notices: (clubId: number) =>
    [...clubKeys.all, "notices", clubId] as const,
  rules: (clubId: number) =>
    [...clubKeys.all, "rules", clubId] as const,
  unread: (clubId: number) =>
    [...clubKeys.all, "unread", clubId] as const,
};

export function useClubDetail(clubId: number) {
  return useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => getClub(clubId),
    enabled: clubId > 0,
  });
}

export function useRecruitingClubs() {
  return useQuery({
    queryKey: clubKeys.recruiting(),
    queryFn: () => getRecruitingClubs(),
    select: ensureArray,
  });
}

export function useClubMembers(clubId: number) {
  return useQuery({
    queryKey: clubKeys.members(clubId),
    queryFn: () => getClubMembers(clubId),
    select: ensureArray,
    enabled: clubId > 0,
  });
}

export function useClubNotices(clubId: number) {
  return useQuery({
    queryKey: clubKeys.notices(clubId),
    queryFn: () => getClubNotices(clubId),
    select: ensureArray,
    enabled: clubId > 0,
  });
}

export function useClubRules(clubId: number) {
  return useQuery({
    queryKey: clubKeys.rules(clubId),
    queryFn: () => getClubRules(clubId),
    select: ensureArray,
    enabled: clubId > 0,
  });
}

export function useClubContentUnreadCount(clubId: number) {
  return useQuery({
    queryKey: clubKeys.unread(clubId),
    queryFn: () => getClubContentUnreadCount(clubId),
    enabled: clubId > 0,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClubRequest) => createClub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      data,
    }: {
      clubId: number;
      data: UpdateClubRequest;
    }) => updateClub(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useUpdateClubPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      data,
    }: {
      clubId: number;
      data: UpdateClubPolicyRequest;
    }) => updateClubPolicy(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}

export function useUpdateMemberRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      data,
    }: {
      clubId: number;
      data: UpdateMemberRolesRequest;
    }) => updateMemberRoles(clubId, data),
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: clubKeys.members(clubId) });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      memberId,
    }: {
      clubId: number;
      memberId: number;
    }) => kickMember(clubId, memberId),
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: clubKeys.members(clubId) });
    },
  });
}

export function useJoinClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clubId: number) => joinClub(clubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
  });
}
