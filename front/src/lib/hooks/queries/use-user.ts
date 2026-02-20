import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  updateUser,
  getMyTennisProfile,
  updateMyTennisProfile,
  getMyClubs,
} from "@/lib/api/user-api";
import type {
  UpdateUserRequest,
  UpdateUserTennisProfileRequest,
} from "@/lib/api/user-api";

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
  tennisProfile: () => [...userKeys.all, "tennisProfile"] as const,
  myClubs: () => [...userKeys.all, "myClubs"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getCurrentUser,
  });
}

export function useMyTennisProfile() {
  return useQuery({
    queryKey: userKeys.tennisProfile(),
    queryFn: getMyTennisProfile,
  });
}

export function useMyClubs() {
  return useQuery({
    queryKey: userKeys.myClubs(),
    queryFn: getMyClubs,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useUpdateTennisProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserTennisProfileRequest) =>
      updateMyTennisProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.tennisProfile() });
    },
  });
}
