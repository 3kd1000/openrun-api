import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawService } from './drawService';
import type { CreateDrawRequest, DrawResponse } from './drawService';
import axios from './api/axiosInstance';

vi.mock('./api/axiosInstance');

describe('drawService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDraw', () => {
    it('should call POST /api/draw with request data', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '최승연'],
            teamB: ['김민수', '이지원'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const request: CreateDrawRequest = {
        userNames: ['정주상', '최승연', '김민수', '이지원'],
        drawType: 'AA',
        numberOfTotalPlayer: 4,
      };

      const result = await drawService.createDraw(request);

      expect(axios.post).toHaveBeenCalledWith('/api/draw', request);
      expect(result).toEqual(mockResponse);
    });

    it('should handle AA type draw request', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '최승연'],
            teamB: ['김민수', '이지원'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const request: CreateDrawRequest = {
        userNames: ['정주상', '최승연', '김민수', '이지원'],
        seedUserNames: [],
        groupAUserNames: [],
        groupBUserNames: [],
        drawType: 'AA',
        numberOfTotalPlayer: 4,
      };

      await drawService.createDraw(request);

      expect(axios.post).toHaveBeenCalledWith('/api/draw', request);
    });

    it('should handle AB type draw request', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '김민수'],
            teamB: ['최승연', '이지원'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const request: CreateDrawRequest = {
        userNames: ['정주상', '김민수', '최승연', '이지원'],
        groupAUserNames: ['정주상', '김민수'],
        groupBUserNames: ['최승연', '이지원'],
        seedUserNames: [],
        drawType: 'AB',
        numberOfTotalPlayer: 4,
      };

      await drawService.createDraw(request);

      expect(axios.post).toHaveBeenCalledWith('/api/draw', request);
    });

    it('should handle SEED type draw request', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '김민수'],
            teamB: ['최승연', '이지원'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const request: CreateDrawRequest = {
        userNames: ['김민수', '이지원'],
        seedUserNames: ['정주상', '최승연'],
        groupAUserNames: [],
        groupBUserNames: [],
        drawType: 'SEED',
        numberOfTotalPlayer: 4,
      };

      await drawService.createDraw(request);

      expect(axios.post).toHaveBeenCalledWith('/api/draw', request);
    });
  });

  describe('createDrawWithSchedule', () => {
    it('should call POST /api/schedules/:scheduleId/draw with schedule ID', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '최승연'],
            teamB: ['김민수', '이지원'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const scheduleId = 1;
      const request: CreateDrawRequest = {
        userNames: ['정주상', '최승연', '김민수', '이지원'],
        drawType: 'AA',
        numberOfTotalPlayer: 4,
      };

      const result = await drawService.createDrawWithSchedule(scheduleId, request);

      expect(axios.post).toHaveBeenCalledWith(
        `/api/schedules/${scheduleId}/draw`,
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle multiple games in response', async () => {
      const mockResponse: DrawResponse = {
        games: [
          {
            gameNo: 1,
            roundNo: 1,
            teamA: ['정주상', '최승연'],
            teamB: ['김민수', '이지원'],
          },
          {
            gameNo: 2,
            roundNo: 1,
            teamA: ['박서준', '홍길동'],
            teamB: ['이영희', '김철수'],
          },
        ],
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

      const request: CreateDrawRequest = {
        userNames: ['정주상', '최승연', '김민수', '이지원', '박서준', '홍길동', '이영희', '김철수'],
        drawType: 'AA',
        numberOfTotalPlayer: 8,
      };

      const result = await drawService.createDrawWithSchedule(1, request);

      expect(result.games).toHaveLength(2);
      expect(result.games[0].gameNo).toBe(1);
      expect(result.games[1].gameNo).toBe(2);
    });

    it('should handle API errors', async () => {
      const errorMessage = '대진 생성에 실패했습니다.';
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      const request: CreateDrawRequest = {
        userNames: ['정주상', '최승연'],
        drawType: 'AA',
        numberOfTotalPlayer: 2,
      };

      await expect(
        drawService.createDrawWithSchedule(1, request)
      ).rejects.toMatchObject({
        response: { data: { message: errorMessage } },
      });
    });
  });
});
