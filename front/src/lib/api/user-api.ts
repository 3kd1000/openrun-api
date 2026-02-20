import axiosInstance from "@/services/api/axiosInstance";
import { updateClubList } from "@/utils/openrunSession";

export type ContactVisibility = "PRIVATE" | "PUBLIC";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  imageUrl: string | null;
  phoneNumber?: string | null;
  phoneVisibility?: ContactVisibility;
  emailVisibility?: ContactVisibility;
  gender?: "MALE" | "FEMALE" | "PRIVATE";
  birthDate?: string | null;
  birthDateVisibility?: ContactVisibility;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserTennisProfile {
  tennisStartedAt: string | null;
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean;
}

export interface UpdateUserRequest {
  name: string;
  imageUrl: string | null;
  phoneNumber?: string | null;
  phoneVisibility?: ContactVisibility;
  emailVisibility?: ContactVisibility;
  gender?: "MALE" | "FEMALE" | "PRIVATE";
  birthDate?: string | null;
  birthDateVisibility?: ContactVisibility;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
}

export interface UpdateUserTennisProfileRequest {
  tennisStartedAt: string | null;
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean | null;
}

export interface MyClub {
  id: number;
  name: string;
  description: string | null;
  region: string | null;
  regionDepth1: string | null;
  regionDepth2: string | null;
  role: string;
  createdAt: string;
}

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get<UserProfile>("/users/me");
  return response.data;
};

export const updateUserActivity = async (): Promise<void> => {
  await axiosInstance.post("/users/me/activity");
};

export const updateUser = async (
  data: UpdateUserRequest
): Promise<UserProfile> => {
  const response = await axiosInstance.put<UserProfile>("/users/me", data);
  return response.data;
};

export const getMyTennisProfile =
  async (): Promise<UserTennisProfile> => {
    const response =
      await axiosInstance.get<UserTennisProfile>("/users/me/profile");
    return response.data;
  };

export const updateMyTennisProfile = async (
  data: UpdateUserTennisProfileRequest
): Promise<UserTennisProfile> => {
  const response = await axiosInstance.put<UserTennisProfile>(
    "/users/me/profile",
    data
  );
  return response.data;
};

export const getMyClubs = async (): Promise<MyClub[]> => {
  const response = await axiosInstance.get<MyClub[]>("/users/me/clubs");
  return response.data;
};

/**
 * 클럽 목록 동기화 (로그인/토큰갱신/가입/탈퇴 시 호출)
 */
export const syncClubList = async (): Promise<MyClub[]> => {
  try {
    const clubs = await getMyClubs();
    updateClubList(clubs.map((c) => ({ id: c.id, name: c.name })));
    return clubs;
  } catch (error) {
    console.error("clubList 동기화 실패:", error);
    return [];
  }
};
