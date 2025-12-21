import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DrawResultModal from './DrawResultModal';
import type { DrawResponse } from '../../../services/drawService';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('DrawResultModal', () => {
  const mockDrawResult: DrawResponse = {
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

  const mockOnClose = vi.fn();
  const mockOnRegenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with title', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('🎯 대진표 생성 완료')).toBeInTheDocument();
  });

  it('should display all games', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText(/경기 1/)).toBeInTheDocument();
    expect(screen.getByText(/경기 2/)).toBeInTheDocument();
  });

  it('should display team members correctly', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('정주상')).toBeInTheDocument();
    expect(screen.getByText('최승연')).toBeInTheDocument();
    expect(screen.getByText('김민수')).toBeInTheDocument();
    expect(screen.getByText('이지원')).toBeInTheDocument();
  });

  it('should display round number', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getAllByText(/1R/)).toHaveLength(2);
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when confirm button is clicked', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const confirmButton = screen.getByText('확인');
    fireEvent.click(confirmButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onRegenerate when regenerate button is clicked', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByText('🔄 다시 생성');
    fireEvent.click(regenerateButton);

    expect(mockOnRegenerate).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should copy to clipboard when copy button is clicked', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);

    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const copyButton = screen.getByText('📋 복사하기');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('🎯 대진표')
    );
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('경기 1')
    );
  });

  it('should show success message after copying', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);

    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const copyButton = screen.getByText('📋 복사하기');
    fireEvent.click(copyButton);

    // Wait for success message
    await screen.findByText('✓ 복사됨');
    expect(screen.getByText('✓ 복사됨')).toBeInTheDocument();
  });

  it('should format draw result as text correctly', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);

    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const copyButton = screen.getByText('📋 복사하기');
    fireEvent.click(copyButton);

    const expectedText = mockWriteText.mock.calls[0][0];
    expect(expectedText).toContain('🎯 대진표');
    expect(expectedText).toContain('경기 1 (1R)');
    expect(expectedText).toContain('Team A: 정주상, 최승연');
    expect(expectedText).toContain('Team B: 김민수, 이지원');
    expect(expectedText).toContain('경기 2 (1R)');
    expect(expectedText).toContain('Team A: 박서준, 홍길동');
    expect(expectedText).toContain('Team B: 이영희, 김철수');
  });

  it('should handle single game result', () => {
    const singleGameResult: DrawResponse = {
      games: [
        {
          gameNo: 1,
          roundNo: 1,
          teamA: ['정주상', '최승연'],
          teamB: ['김민수', '이지원'],
        },
      ],
    };

    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={singleGameResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText(/경기 1/)).toBeInTheDocument();
    expect(screen.queryByText(/경기 2/)).not.toBeInTheDocument();
  });

  it('should handle multi-round games', () => {
    const multiRoundResult: DrawResponse = {
      games: [
        {
          gameNo: 1,
          roundNo: 1,
          teamA: ['정주상', '최승연'],
          teamB: ['김민수', '이지원'],
        },
        {
          gameNo: 2,
          roundNo: 2,
          teamA: ['박서준', '홍길동'],
          teamB: ['이영희', '김철수'],
        },
      ],
    };

    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={multiRoundResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText(/1R/)).toBeInTheDocument();
    expect(screen.getByText(/2R/)).toBeInTheDocument();
  });

  it('should display Team A and Team B labels', () => {
    render(
      <DrawResultModal
        scheduleId={1}
        drawResult={mockDrawResult}
        onClose={mockOnClose}
        onRegenerate={mockOnRegenerate}
      />
    );

    const teamALabels = screen.getAllByText('Team A');
    const teamBLabels = screen.getAllByText('Team B');

    expect(teamALabels).toHaveLength(2); // 2 games
    expect(teamBLabels).toHaveLength(2); // 2 games
  });
});
