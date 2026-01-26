import { describe, it, expect, vi, beforeEach } from "vitest";
import { clubService } from "./clubService";
import type {
  Club,
  CreateClubRequest,
  UpdateClubRequest,
  UpdateClubPolicyRequest,
  ClubRule,
  CreateClubRuleRequest,
  UpdateClubRuleRequest,
  ClubNotice,
  CreateClubNoticeRequest,
  UpdateClubNoticeRequest,
} from "../types/club";
import type { ExternalRequestResponse } from "./clubService";
import type { UserResponse } from "./userService";
import axios from "./api/axiosInstance";

vi.mock("./api/axiosInstance");

describe("clubService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClub: Club = {
    id: 1,
    name: "테스트 클럽",
    description: "테스트 설명",
    region: "서울",
    ownerUserId: 1,
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
    memberCount: 10,
  };

  const mockExternalRequest: ExternalRequestResponse = {
    id: 1,
    clubId: 1,
    scheduleId: 10,
    type: "GUEST",
    status: "PENDING",
    requesterUserId: 100,
    requesterName: "테스트 유저",
    createdAt: "2025-01-01T00:00:00",
  };

  const mockClubRule: ClubRule = {
    id: 1,
    clubId: 1,
    title: "회칙 1조",
    content: "테스트 내용",
    displayOrder: 1,
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  };

  const mockClubNotice: ClubNotice = {
    id: 1,
    clubId: 1,
    title: "공지사항",
    content: "공지 내용",
    displayOrder: 1,
    createdAt: "2025-01-01T00:00:00",
    updatedAt: "2025-01-01T00:00:00",
  };

  const mockUser: UserResponse = {
    id: 1,
    name: "테스트 유저",
    email: "test@example.com",
    imageUrl: null,
  };

  describe("클럽 CRUD", () => {
    it("POST /clubs 호출하여 클럽 생성", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockClub });

      const request: CreateClubRequest = {
        name: "테스트 클럽",
        description: "테스트 설명",
        region: "서울",
      };

      const result = await clubService.createClub(request);

      expect(axios.post).toHaveBeenCalledWith("/clubs", request);
      expect(result).toEqual(mockClub);
    });

    it("PUT /clubs/:id 호출하여 클럽 수정", async () => {
      const updatedClub = { ...mockClub, name: "수정된 클럽" };
      vi.mocked(axios.put).mockResolvedValueOnce({ data: updatedClub });

      const request: UpdateClubRequest = {
        name: "수정된 클럽",
      };

      const result = await clubService.updateClub(1, request);

      expect(axios.put).toHaveBeenCalledWith("/clubs/1", request);
      expect(result.name).toBe("수정된 클럽");
    });

    it("PATCH /clubs/:id/policy 호출하여 클럽 정책 수정", async () => {
      const updatedClub = { ...mockClub, joinPolicy: "APPROVAL" };
      vi.mocked(axios.patch).mockResolvedValueOnce({ data: updatedClub });

      const request: UpdateClubPolicyRequest = {
        joinPolicy: "APPROVAL",
        interclubRecruitmentStatus: "CLOSED",
        memberRecruitmentStatus: "OPEN",
      };

      const result = await clubService.updateClubPolicy(1, request);

      expect(axios.patch).toHaveBeenCalledWith("/clubs/1/policy", request);
      expect(result).toEqual(updatedClub);
    });
  });

  describe("외부 요청 관리", () => {
    it("GET /clubs/:id/external-requests 호출하여 외부요청 목록 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockExternalRequest] });

      const result = await clubService.listExternalRequests(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/external-requests", {
        params: undefined,
      });
      expect(result).toEqual([mockExternalRequest]);
    });

    it("타입과 상태로 외부요청 필터링 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockExternalRequest] });

      const result = await clubService.listExternalRequests(1, {
        type: "GUEST",
        status: "PENDING",
      });

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/external-requests", {
        params: { type: "GUEST", status: "PENDING" },
      });
      expect(result).toEqual([mockExternalRequest]);
    });

    it("POST /clubs/:id/external-requests/:requestId/approve 호출하여 승인", async () => {
      const approvedRequest = { ...mockExternalRequest, status: "APPROVED" as const };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: approvedRequest });

      const result = await clubService.approveExternalRequest(1, 1, "승인합니다");

      expect(axios.post).toHaveBeenCalledWith(
        "/clubs/1/external-requests/1/approve",
        { note: "승인합니다" }
      );
      expect(result.status).toBe("APPROVED");
    });

    it("note 없이 승인 시 null 전송", async () => {
      const approvedRequest = { ...mockExternalRequest, status: "APPROVED" as const };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: approvedRequest });

      await clubService.approveExternalRequest(1, 1);

      expect(axios.post).toHaveBeenCalledWith(
        "/clubs/1/external-requests/1/approve",
        { note: null }
      );
    });

    it("POST /clubs/:id/external-requests/:requestId/reject 호출하여 거절", async () => {
      const rejectedRequest = { ...mockExternalRequest, status: "REJECTED" as const };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: rejectedRequest });

      const result = await clubService.rejectExternalRequest(1, 1, "거절 사유");

      expect(axios.post).toHaveBeenCalledWith(
        "/clubs/1/external-requests/1/reject",
        { note: "거절 사유" }
      );
      expect(result.status).toBe("REJECTED");
    });
  });

  describe("게스트 모집", () => {
    it("POST /clubs/:id/guest-recruit/:scheduleId/apply 호출하여 신청", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockExternalRequest });

      const result = await clubService.applyGuestRecruit(1, 10);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/guest-recruit/10/apply");
      expect(result).toEqual(mockExternalRequest);
    });

    it("DELETE /clubs/:id/guest-recruit/:scheduleId/apply 호출하여 신청 취소", async () => {
      const cancelledRequest = { ...mockExternalRequest, status: "CANCELLED" as const };
      vi.mocked(axios.delete).mockResolvedValueOnce({ data: cancelledRequest });

      const result = await clubService.cancelGuestRecruit(1, 10);

      expect(axios.delete).toHaveBeenCalledWith("/clubs/1/guest-recruit/10/apply");
      expect(result.status).toBe("CANCELLED");
    });

    it("GET /clubs/:id/guest-recruit/:scheduleId/my-request 호출하여 내 신청 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockExternalRequest });

      const result = await clubService.getMyGuestRecruitRequest(1, 10);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/guest-recruit/10/my-request");
      expect(result).toEqual(mockExternalRequest);
    });

    it("POST /clubs/:id/guest-recruit/:scheduleId/inquiry 호출하여 문의 생성", async () => {
      const mockPost = { id: 1, content: "문의 내용" };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockPost });

      const result = await clubService.createGuestRecruitInquiry(1, 10, "문의 내용");

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/guest-recruit/10/inquiry", {
        content: "문의 내용",
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe("교류전 모집", () => {
    it("POST /clubs/:id/interclub-recruit/:scheduleId/apply 호출하여 신청", async () => {
      const interclubRequest = { ...mockExternalRequest, type: "INTERCLUB" as const };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: interclubRequest });

      const result = await clubService.applyInterclubRecruit(1, 10);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/interclub-recruit/10/apply");
      expect(result.type).toBe("INTERCLUB");
    });

    it("DELETE /clubs/:id/interclub-recruit/:scheduleId/apply 호출하여 신청 취소", async () => {
      const cancelledRequest = { ...mockExternalRequest, status: "CANCELLED" as const };
      vi.mocked(axios.delete).mockResolvedValueOnce({ data: cancelledRequest });

      const result = await clubService.cancelInterclubRecruit(1, 10);

      expect(axios.delete).toHaveBeenCalledWith("/clubs/1/interclub-recruit/10/apply");
      expect(result.status).toBe("CANCELLED");
    });

    it("GET /clubs/:id/interclub-recruit/:scheduleId/my-request 호출하여 내 신청 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockExternalRequest });

      const result = await clubService.getMyInterclubRecruitRequest(1, 10);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/interclub-recruit/10/my-request");
      expect(result).toEqual(mockExternalRequest);
    });

    it("POST /clubs/:id/interclub-recruit/:scheduleId/inquiry 호출하여 문의 생성", async () => {
      const mockPost = { id: 1, content: "교류전 문의" };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockPost });

      const result = await clubService.createInterclubRecruitInquiry(1, 10, "교류전 문의");

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/interclub-recruit/10/inquiry", {
        content: "교류전 문의",
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe("가입 문의", () => {
    it("GET /clubs/:id/join/my-request 호출하여 내 가입 신청 조회", async () => {
      const joinRequest = { ...mockExternalRequest, type: "JOIN" as const };
      vi.mocked(axios.get).mockResolvedValueOnce({ data: joinRequest });

      const result = await clubService.getMyJoinRequest(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/join/my-request");
      expect(result.type).toBe("JOIN");
    });

    it("POST /clubs/:id/join/inquiry 호출하여 가입 문의 생성", async () => {
      const mockPost = { id: 1, content: "가입 문의" };
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockPost });

      const result = await clubService.createJoinInquiry(1, "가입 문의");

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/join/inquiry", {
        content: "가입 문의",
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe("클럽 회원 목록", () => {
    it("GET /clubs/:id/members 호출하여 ACTIVE 회원 목록 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockUser] });

      const result = await clubService.getClubMembers(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/members", {
        params: { status: "ACTIVE" },
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe("클럽 회칙", () => {
    it("GET /clubs/:id/rules 호출하여 회칙 목록 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockClubRule] });

      const result = await clubService.getClubRules(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/rules");
      expect(result).toEqual([mockClubRule]);
    });

    it("POST /clubs/:id/rules 호출하여 회칙 생성", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockClubRule });

      const request: CreateClubRuleRequest = {
        title: "회칙 1조",
        content: "테스트 내용",
      };

      const result = await clubService.createClubRule(1, request);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/rules", request);
      expect(result).toEqual(mockClubRule);
    });

    it("PUT /clubs/:id/rules/:ruleId 호출하여 회칙 수정", async () => {
      const updatedRule = { ...mockClubRule, title: "수정된 회칙" };
      vi.mocked(axios.put).mockResolvedValueOnce({ data: updatedRule });

      const request: UpdateClubRuleRequest = {
        title: "수정된 회칙",
        content: "수정된 내용",
      };

      const result = await clubService.updateClubRule(1, 1, request);

      expect(axios.put).toHaveBeenCalledWith("/clubs/1/rules/1", request);
      expect(result.title).toBe("수정된 회칙");
    });

    it("DELETE /clubs/:id/rules/:ruleId 호출하여 회칙 삭제", async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({});

      await clubService.deleteClubRule(1, 1);

      expect(axios.delete).toHaveBeenCalledWith("/clubs/1/rules/1");
    });

    it("PATCH /clubs/:id/rules/reorder 호출하여 회칙 순서 변경", async () => {
      vi.mocked(axios.patch).mockResolvedValueOnce({});

      await clubService.reorderClubRules(1, { orders: { 1: 3, 2: 1, 3: 2 } });

      expect(axios.patch).toHaveBeenCalledWith("/clubs/1/rules/reorder", {
        orders: { 1: 3, 2: 1, 3: 2 },
      });
    });
  });

  describe("클럽 공지사항", () => {
    it("GET /clubs/:id/notices 호출하여 공지사항 목록 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: [mockClubNotice] });

      const result = await clubService.getClubNotices(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/notices");
      expect(result).toEqual([mockClubNotice]);
    });

    it("POST /clubs/:id/notices 호출하여 공지사항 생성", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockClubNotice });

      const request: CreateClubNoticeRequest = {
        title: "공지사항",
        content: "공지 내용",
      };

      const result = await clubService.createClubNotice(1, request);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/notices", request);
      expect(result).toEqual(mockClubNotice);
    });

    it("PUT /clubs/:id/notices/:noticeId 호출하여 공지사항 수정", async () => {
      const updatedNotice = { ...mockClubNotice, title: "수정된 공지" };
      vi.mocked(axios.put).mockResolvedValueOnce({ data: updatedNotice });

      const request: UpdateClubNoticeRequest = {
        title: "수정된 공지",
        content: "수정된 공지 내용",
      };

      const result = await clubService.updateClubNotice(1, 1, request);

      expect(axios.put).toHaveBeenCalledWith("/clubs/1/notices/1", request);
      expect(result.title).toBe("수정된 공지");
    });

    it("DELETE /clubs/:id/notices/:noticeId 호출하여 공지사항 삭제", async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({});

      await clubService.deleteClubNotice(1, 1);

      expect(axios.delete).toHaveBeenCalledWith("/clubs/1/notices/1");
    });

    it("GET /clubs/:id/notices/unread-count 호출하여 읽지 않은 공지 수 조회", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: { unreadCount: 3 } });

      const result = await clubService.getClubNoticeUnreadCount(1);

      expect(axios.get).toHaveBeenCalledWith("/clubs/1/notices/unread-count");
      expect(result.unreadCount).toBe(3);
    });

    it("POST /clubs/:id/notices/mark-read 호출하여 공지 읽음 처리", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({});

      await clubService.markClubNoticesRead(1, 5);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/notices/mark-read", {
        upToNoticeId: 5,
      });
    });

    it("upToNoticeId 없이 읽음 처리 시 null 전송", async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({});

      await clubService.markClubNoticesRead(1);

      expect(axios.post).toHaveBeenCalledWith("/clubs/1/notices/mark-read", {
        upToNoticeId: null,
      });
    });
  });

  describe("에러 처리", () => {
    it("API 에러 시 예외 발생", async () => {
      const error = new Error("Network Error");
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(clubService.getClubMembers(1)).rejects.toThrow("Network Error");
    });
  });
});
