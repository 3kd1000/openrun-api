import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../services/api/axiosInstance';
import { TrophyIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '../../../../../components/common/Icons';
import { logError } from '../../../../../utils/errorHandler';

interface RankingEntry {
  rank: number;
  userId: number;
  userName: string;
  totalMatches: number;
  points: number;
  winRate: number;
  wins: number;
  draws: number;
  losses: number;
}

interface ScoreboardResponse {
  rankings: RankingEntry[];
}

type SortType = 'points' | 'winRate';

interface TopPlayersWidgetProps {
  clubId: number;
  maxItems?: number;
  sortBy?: SortType;
  defaultExpanded?: boolean;
  /**
   * controlled mode: 상위에서 expanded 상태를 관리할 때 사용
   */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const TopPlayersWidget: React.FC<TopPlayersWidgetProps> = ({
  clubId,
  maxItems = 3,
  sortBy = 'points',
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}) => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSortBy, setCurrentSortBy] = useState<SortType>(sortBy);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;

  useEffect(() => {
    loadRankings();
  }, [clubId, currentSortBy]);

  const loadRankings = async () => {
    try {
      setIsLoading(true);

      // 최근 90일 기준으로 조회
      const now = new Date();
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = now.toISOString();

      const response = await axiosInstance.get<ScoreboardResponse>(
        `/clubs/${clubId}/scoreboard`,
        {
          params: {
            startDate,
            endDate,
            sortBy: currentSortBy
          }
        }
      );

      setRankings(response.data.rankings.slice(0, maxItems));
    } catch (error: unknown) {
      logError('랭킹 조회', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/scoreboard');
  };

  const handleSortChange = (newSort: SortType) => {
    setCurrentSortBy(newSort);
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(next);
      return;
    }
    setInternalExpanded(next);
  };

  const getOrdinalSuffix = (n: number) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "st";
    if (mod10 === 2 && mod100 !== 12) return "nd";
    if (mod10 === 3 && mod100 !== 13) return "rd";
    return "th";
  };

  const getRankDisplay = (rank: number) => {
    return (
      <span className="text-sm font-semibold text-muted-foreground leading-none">
        {rank}
        {getOrdinalSuffix(rank)}
      </span>
    );
  };

  const getDisplayTitle = () => {
    if (currentSortBy === 'winRate') {
      return '최근 3개월 승률 Top 3';
    }
    return '최근 3개월 승점 Top 3';
  };

  return (
    <div className="border border-border rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 cursor-pointer text-foreground hover:text-primary transition-colors"
          onClick={handleToggleExpand}
        >
          <TrophyIcon size={16} />
          <span className="text-sm font-semibold">{getDisplayTitle()}</span>
          {isExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </button>
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 px-3 text-muted-foreground text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3">
          {/* 정렬 토글 */}
          <div className="flex gap-2 mb-3 bg-muted/50 p-0.5 rounded">
            <button
              className={`flex-1 py-2 border-none bg-transparent rounded text-sm cursor-pointer transition-all ${
                currentSortBy === 'points' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-muted-foreground'
              }`}
              onClick={() => handleSortChange('points')}
            >
              승점
            </button>
            <button
              className={`flex-1 py-2 border-none bg-transparent rounded text-sm cursor-pointer transition-all ${
                currentSortBy === 'winRate' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-muted-foreground'
              }`}
              onClick={() => handleSortChange('winRate')}
            >
              승률
            </button>
          </div>

          {isLoading && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          )}

          {!isLoading && rankings.length === 0 && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              최근 3개월 경기 기록이 없습니다
            </div>
          )}

          {!isLoading && rankings.length > 0 && (
            <div className="flex flex-col gap-2">
              {rankings.map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg text-sm min-h-[44px]"
                >
                  <span className="flex items-center justify-center min-w-[40px]">
                    {getRankDisplay(index + 1)}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground">{entry.userName}</span>
                  <span className="flex items-center gap-2">
                    <span className={`text-sm ${currentSortBy === 'points' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {entry.points}점
                    </span>
                    <span className={`text-sm ${currentSortBy === 'winRate' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {entry.winRate}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {entry.wins}승 {entry.draws}무 {entry.losses}패
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopPlayersWidget;
