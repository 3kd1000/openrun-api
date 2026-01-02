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
    scheduledAt: '2025-01-01T10:00:00',
    maxCapacity: 8,
    currentParticipants: 6,
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  };

  const mockParticipants: Participant[] = [
    { id: 1, scheduleId: 1, userId: 1, userName: 'User 1', status: 'CONFIRMED', position: 1, joinedAt: '2025-01-01T00:00:00' },
    { id: 2, scheduleId: 1, userId: 2, userName: 'User 2', status: 'CONFIRMED', position: 2, joinedAt: '2025-01-01T00:00:00' },
    { id: 3, scheduleId: 1, userId: 3, userName: 'User 3', status: 'CONFIRMED', position: 3, joinedAt: '2025-01-01T00:00:00' },
    { id: 4, scheduleId: 1, userId: 4, userName: 'User 4', status: 'CONFIRMED', position: 4, joinedAt: '2025-01-01T00:00:00' },
    { id: 5, scheduleId: 1, userId: 5, userName: 'User 5', status: 'CONFIRMED', position: 5, joinedAt: '2025-01-01T00:00:00' },
    { id: 6, scheduleId: 1, userId: 6, userName: 'User 6', status: 'CONFIRMED', position: 6, joinedAt: '2025-01-01T00:00:00' },
    { id: 7, scheduleId: 1, userId: 7, userName: 'User 7', status: 'WAITING', position: 7, joinedAt: '2025-01-01T00:00:00' },
    { id: 8, scheduleId: 1, userId: 8, userName: 'User 8', status: 'WAITING', position: 8, joinedAt: '2025-01-01T00:00:00' },
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

    expect(screen.getByText(/참가자 \(6명\)/)).toBeInTheDocument();
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

    // 6명일 때 시드는 2명이어야 함
    expect(screen.getByText(/시드 플레이어 \(2명\)/)).toBeInTheDocument();
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

    expect(screen.getByText(/대기 참가자 \(2명\)/)).toBeInTheDocument();
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

    vi.mocked(drawService.createDrawWithSchedule).mockResolvedValueOnce(mockDrawResponse);

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
      expect(drawService.createDrawWithSchedule).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockDrawResponse);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show loading state during draw creation', async () => {
    let resolvePromise: any;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(drawService.createDrawWithSchedule).mockReturnValueOnce(promise as any);

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
    resolvePromise({ games: [] });
  });

  it('should display error message on draw creation failure', async () => {
    const errorMessage = '대진 생성에 실패했습니다.';
    vi.mocked(drawService.createDrawWithSchedule).mockRejectedValueOnce({
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

    // 6명을 반반 나눠야 함 (3명, 3명)
    expect(screen.getByText(/그룹 A \(3명\)/)).toBeInTheDocument();
    expect(screen.getByText(/그룹 B \(3명\)/)).toBeInTheDocument();
  });

  it('should validate groups have players in AB type', async () => {
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

    // AB 타입에서는 각 그룹에 최소 1명은 있어야 대진 생성 가능
    // 초기 상태에서는 자동 분할되므로 활성화
    const createButton = screen.getByRole('button', { name: '대진 생성' });
    expect(createButton).not.toBeDisabled();
  });
});
