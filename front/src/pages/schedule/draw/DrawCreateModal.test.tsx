import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrawCreateModal from './DrawCreateModal';
import type { Participant, Schedule } from '../../../types/schedule';
import { drawService } from '../../../services/drawService';
import type { DrawResponse } from '../../../services/drawService';

vi.mock('../../../services/drawService');

describe('DrawCreateModal', () => {
  const mockSchedule: Schedule = {
    id: 1,
    clubId: 1,
    courtName: '테스트 코트',
    scheduledAt: '2099-01-01T10:00:00', // 미래 날짜로 설정 (과거 일정 검증 우회)
    maxCapacity: 16,
    currentParticipants: 6,
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  };

  // 6명 CONFIRMED + 2명 WAITING = 8명
  const mockParticipants: Participant[] = [
    { id: 1, scheduleId: 1, userId: 1, userName: 'User 1', status: 'CONFIRMED', position: 1, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 2, scheduleId: 1, userId: 2, userName: 'User 2', status: 'CONFIRMED', position: 2, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 3, scheduleId: 1, userId: 3, userName: 'User 3', status: 'CONFIRMED', position: 3, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 4, scheduleId: 1, userId: 4, userName: 'User 4', status: 'CONFIRMED', position: 4, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 5, scheduleId: 1, userId: 5, userName: 'User 5', status: 'CONFIRMED', position: 5, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 6, scheduleId: 1, userId: 6, userName: 'User 6', status: 'CONFIRMED', position: 6, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 7, scheduleId: 1, userId: 7, userName: 'User 7', status: 'WAITING', position: 7, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 8, scheduleId: 1, userId: 8, userName: 'User 8', status: 'WAITING', position: 8, joinedAt: '2025-01-01T00:00:00', asGuest: false },
  ];

  // AB 타입 테스트용 8명 참가자 (모두 CONFIRMED)
  const mockParticipants8Confirmed: Participant[] = [
    { id: 1, scheduleId: 1, userId: 1, userName: 'User 1', status: 'CONFIRMED', position: 1, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 2, scheduleId: 1, userId: 2, userName: 'User 2', status: 'CONFIRMED', position: 2, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 3, scheduleId: 1, userId: 3, userName: 'User 3', status: 'CONFIRMED', position: 3, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 4, scheduleId: 1, userId: 4, userName: 'User 4', status: 'CONFIRMED', position: 4, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 5, scheduleId: 1, userId: 5, userName: 'User 5', status: 'CONFIRMED', position: 5, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 6, scheduleId: 1, userId: 6, userName: 'User 6', status: 'CONFIRMED', position: 6, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 7, scheduleId: 1, userId: 7, userName: 'User 7', status: 'CONFIRMED', position: 7, joinedAt: '2025-01-01T00:00:00', asGuest: false },
    { id: 8, scheduleId: 1, userId: 8, userName: 'User 8', status: 'CONFIRMED', position: 8, joinedAt: '2025-01-01T00:00:00', asGuest: false },
  ];

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with title', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: '대진 생성' })).toBeInTheDocument();
  });

  it('should display three draw type buttons', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('AA (랜덤)')).toBeInTheDocument();
    expect(screen.getByText('AB (그룹별)')).toBeInTheDocument();
    expect(screen.getByText('SEED (시드)')).toBeInTheDocument();
  });

  it('should have AA type selected by default', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const aaButton = screen.getByText('AA (랜덤)');
    expect(aaButton).toHaveClass('active');
  });

  it('should switch to AB type when clicked', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const abButton = screen.getByText('AB (그룹별)');
    fireEvent.click(abButton);

    expect(abButton).toHaveClass('active');
    expect(screen.getByText(/그룹 A/)).toBeInTheDocument();
    expect(screen.getByText(/그룹 B/)).toBeInTheDocument();
  });

  it('should switch to SEED type when clicked', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const seedButton = screen.getByText('SEED (시드)');
    fireEvent.click(seedButton);

    expect(seedButton).toHaveClass('active');
    expect(screen.getByText(/시드 플레이어/)).toBeInTheDocument();
    expect(screen.getByText(/일반 플레이어/)).toBeInTheDocument();
  });

  it('should display confirmed participants count', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // 실제 컴포넌트: "참가 확정 (6명)"
    expect(screen.getByText(/참가 확정 \(6명\)/)).toBeInTheDocument();
  });

  it('should calculate correct seed count for 6 players', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const seedButton = screen.getByText('SEED (시드)');
    fireEvent.click(seedButton);

    // 6명일 때 시드는 2명 - 형식: "시드 플레이어 (2/2명)"
    expect(screen.getByText(/시드 플레이어 \(2\/2명\)/)).toBeInTheDocument();
    expect(screen.getByText(/일반 플레이어 \(4명\)/)).toBeInTheDocument();
  });

  it('should show waiting participants in AB/SEED types', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const abButton = screen.getByText('AB (그룹별)');
    fireEvent.click(abButton);

    // 실제 컴포넌트: "대기열 (2명)"
    expect(screen.getByText(/대기열 \(2명\)/)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should enable create button when valid number of players (6)', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const createButton = screen.getByRole('button', { name: '대진 생성' });
    expect(createButton).not.toBeDisabled();
  });

  it('successfully create AA type draw', async () => {
    const mockDrawResponse: DrawResponse = {
      games: [
        {
          gameNo: 1,
          roundNo: 1,
          teamA: ['정주상', '최승연'],
          teamB: ['김민수', '이지원'],
        },
      ],
    };

    // 실제 컴포넌트는 createDrawWithScheduleByIds를 호출
    vi.mocked(drawService.createDrawWithScheduleByIds).mockResolvedValueOnce(mockDrawResponse);

    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const createButton = screen.getByRole('button', { name: '대진 생성' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(drawService.createDrawWithScheduleByIds).toHaveBeenCalled();
    });

    // 결과 화면이 표시되면 "확인" 버튼이 보여야 함
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    });
  });

  it('should show loading state during draw creation', async () => {
    let resolvePromise: (value: DrawResponse) => void;
    const promise = new Promise<DrawResponse>(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(drawService.createDrawWithScheduleByIds).mockReturnValueOnce(promise);

    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const createButton = screen.getByRole('button', { name: '대진 생성' });
    fireEvent.click(createButton);

    expect(await screen.findByText('생성 중...')).toBeInTheDocument();

    // Cleanup
    resolvePromise!({ games: [] });
  });

  it('should display error message on draw creation failure', async () => {
    const errorMessage = '대진 생성에 실패했습니다.';
    vi.mocked(drawService.createDrawWithScheduleByIds).mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const createButton = screen.getByRole('button', { name: '대진 생성' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should split participants evenly for AB type', () => {
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const abButton = screen.getByText('AB (그룹별)');
    fireEvent.click(abButton);

    // 6명(CONFIRMED)을 반반 나눠야 함 (3명, 3명)
    expect(screen.getByText(/그룹 A \(3명\)/)).toBeInTheDocument();
    expect(screen.getByText(/그룹 B \(3명\)/)).toBeInTheDocument();
  });

  it('should validate groups have players in AB type with 8 confirmed players', async () => {
    // AB 타입은 최소 8명 필요, 8명 CONFIRMED 참가자 사용
    render(
      <DrawCreateModal
        scheduleId={1}
        schedule={mockSchedule}
        participants={mockParticipants8Confirmed}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const abButton = screen.getByText('AB (그룹별)');
    fireEvent.click(abButton);

    // AB 타입에서는 각 그룹에 최소 1명은 있어야 대진 생성 가능
    // 8명 확정이면 4명/4명으로 분할되어 활성화
    const createButton = screen.getByRole('button', { name: '대진 생성' });
    expect(createButton).not.toBeDisabled();
  });
});
