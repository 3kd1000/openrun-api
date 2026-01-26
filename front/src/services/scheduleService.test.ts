import { describe, it, expect, vi, beforeEach } from "vitest";
import { scheduleService } from "./scheduleService";
import type { Schedule, CreateScheduleRequest } from "../types/schedule";
import axios from "./api/axiosInstance";

vi.mock("./api/axiosInstance");

describe("scheduleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSchedule: Schedule = {
    id: 1,
    clubId: 1,
    clubName: "테스트 클럽",
    courtName: "테스트 코트",
    scheduledAt: "2025-01-15T10:00:00",
    durationMinutes: 120,
    maxCapacity: 8,
    currentParticipants: 4,
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  };

  describe("createSchedule", () => {
    it("POST /schedules 호출하여 일정 생성", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockSchedule });

      const request: CreateScheduleRequest = {
        clubId: 1,
        courtName: "테스트 코트",
        scheduledAt: "2025-01-15T10:00:00",
        durationMinutes: 120,
        maxCapacity: 8,
      };

      const result = await scheduleService.createSchedule(request);

      expect(axios.post).toHaveBeenCalledWith("/schedules", request);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe("getAllSchedules", () => {
    it("clubId 없이 전체 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockSchedule] });

      const result = await scheduleService.getAllSchedules();

      expect(axios.get).toHaveBeenCalledWith("/schedules", {
        params: undefined,
      });
      expect(result).toEqual([mockSchedule]);
    });

    it("clubId로 특정 클럽 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockSchedule] });

      const result = await scheduleService.getAllSchedules(1);

      expect(axios.get).toHaveBeenCalledWith("/schedules", {
        params: { clubId: 1 },
      });
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe("getScheduleById", () => {
    it("특정 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockSchedule });

      const result = await scheduleService.getScheduleById(1);

      expect(axios.get).toHaveBeenCalledWith("/schedules/1", {
        params: undefined,
      });
      expect(result).toEqual(mockSchedule);
    });

    it("userId 포함하여 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockSchedule });

      const result = await scheduleService.getScheduleById(1, 100);

      expect(axios.get).toHaveBeenCalledWith("/schedules/1", {
        params: { userId: 100 },
      });
      expect(result).toEqual(mockSchedule);
    });
  });

  describe("getUpcomingSchedules", () => {
    it("향후 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockSchedule] });

      const result = await scheduleService.getUpcomingSchedules(1);

      expect(axios.get).toHaveBeenCalledWith("/schedules", {
        params: { clubId: 1, upcoming: true },
      });
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe("getSchedulesByDateRange", () => {
    it("날짜 범위로 일정 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockSchedule] });

      const result = await scheduleService.getSchedulesByDateRange(
        1,
        "2025-01-01",
        "2025-01-31"
      );

      expect(axios.get).toHaveBeenCalledWith("/schedules", {
        params: { clubId: 1, start: "2025-01-01", end: "2025-01-31" },
      });
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe("updateSchedule", () => {
    it("PUT /schedules/:id 호출하여 일정 수정", async () => {
      const updatedSchedule = { ...mockSchedule, courtName: "수정된 코트" };
      vi.mocked(axios.put).mockResolvedValueOnce({ data: updatedSchedule });

      const request: CreateScheduleRequest = {
        clubId: 1,
        courtName: "수정된 코트",
        scheduledAt: "2025-01-15T10:00:00",
        durationMinutes: 120,
        maxCapacity: 8,
      };

      const result = await scheduleService.updateSchedule(1, request);

      expect(axios.put).toHaveBeenCalledWith("/schedules/1", request);
      expect(result.courtName).toBe("수정된 코트");
    });
  });

  describe("deleteSchedule", () => {
    it("DELETE /schedules/:id 호출하여 일정 삭제", async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({});

      await scheduleService.deleteSchedule(1);

      expect(axios.delete).toHaveBeenCalledWith("/schedules/1");
    });
  });

  describe("getMyParticipations", () => {
    it("내가 참여한 일정 ID 목록 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [1, 2, 3] });

      const result = await scheduleService.getMyParticipations(100);

      expect(axios.get).toHaveBeenCalledWith("/schedules/my-participations", {
        params: { userId: 100 },
      });
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("deleteDraw", () => {
    it("DELETE /schedules/:id/draw 호출하여 대진표 삭제", async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({});

      await scheduleService.deleteDraw(1);

      expect(axios.delete).toHaveBeenCalledWith("/schedules/1/draw");
    });
  });

  describe("updateSchedulePinned", () => {
    it("일정 PIN 설정", async () => {
      const pinnedSchedule = { ...mockSchedule, pinned: true };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: pinnedSchedule });

      const result = await scheduleService.updateSchedulePinned(1, true, 100);

      expect(axios.patch).toHaveBeenCalledWith(
        "/schedules/1/pinned",
        { pinned: true },
        { params: { userId: 100 } }
      );
      expect(result.pinned).toBe(true);
    });

    it("일정 PIN 해제", async () => {
      const unpinnedSchedule = { ...mockSchedule, pinned: false };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: unpinnedSchedule });

      const result = await scheduleService.updateSchedulePinned(1, false, 100);

      expect(axios.patch).toHaveBeenCalledWith(
        "/schedules/1/pinned",
        { pinned: false },
        { params: { userId: 100 } }
      );
      expect(result.pinned).toBe(false);
    });
  });

  describe("updateGuestRecruit", () => {
    it("게스트 모집 ON 설정 (메모 포함)", async () => {
      const recruitSchedule = {
        ...mockSchedule,
        guestRecruitOpen: true,
        guestRecruitNote: "NTRP 3.5 이상",
      };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: recruitSchedule });

      const result = await scheduleService.updateGuestRecruit(
        1,
        true,
        100,
        "NTRP 3.5 이상"
      );

      expect(axios.patch).toHaveBeenCalledWith(
        "/schedules/1/guest-recruit",
        { open: true, note: "NTRP 3.5 이상" },
        { params: { userId: 100 } }
      );
      expect(result.guestRecruitOpen).toBe(true);
    });

    it("게스트 모집 OFF 설정", async () => {
      const recruitSchedule = { ...mockSchedule, guestRecruitOpen: false };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: recruitSchedule });

      const result = await scheduleService.updateGuestRecruit(1, false, 100);

      expect(axios.patch).toHaveBeenCalledWith(
        "/schedules/1/guest-recruit",
        { open: false, note: null },
        { params: { userId: 100 } }
      );
      expect(result.guestRecruitOpen).toBe(false);
    });
  });

  describe("updateInterclubRecruit", () => {
    it("교류전 모집 ON 설정", async () => {
      const recruitSchedule = {
        ...mockSchedule,
        interclubRecruitOpen: true,
        interclubRecruitNote: "4vs4 교류전",
      };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: recruitSchedule });

      const result = await scheduleService.updateInterclubRecruit(
        1,
        true,
        100,
        "4vs4 교류전"
      );

      expect(axios.patch).toHaveBeenCalledWith(
        "/schedules/1/interclub-recruit",
        { open: true, note: "4vs4 교류전" },
        { params: { userId: 100 } }
      );
      expect(result.interclubRecruitOpen).toBe(true);
    });
  });

  describe("에러 처리", () => {
    it("API 에러 시 예외 발생", async () => {
      const error = new Error("Network Error");
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(scheduleService.getScheduleById(1)).rejects.toThrow(
        "Network Error"
      );
    });
  });
});
