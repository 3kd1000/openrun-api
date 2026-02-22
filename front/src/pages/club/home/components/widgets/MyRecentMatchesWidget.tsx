import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyRecentMatches,
  getMyClubStats,
  type MyRecentMatchResponse,
  type MyClubStatsResponse,
} from "../../../../../services/api/userApi";
import {
  TrophyIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../../../../../components/common/Icons";
import { logError } from "../../../../../utils/errorHandler";
import { getOpenRunSession } from "../../../../../utils/openrunSession";

interface MyRecentMatchesWidgetProps {
  clubId: number;
  maxItems?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const MyRecentMatchesWidget: React.FC<MyRecentMatchesWidgetProps> = ({
  clubId,
  maxItems = 5,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MyRecentMatchResponse[]>([]);
  const [clubStats, setClubStats] = useState<MyClubStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;
  const myName = getOpenRunSession().userName || "나";

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, maxItems]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [matchData, statsData] = await Promise.all([
        getMyRecentMatches(clubId, maxItems),
        getMyClubStats(clubId),
      ]);
      setMatches(matchData);
      setClubStats(statsData);
    } catch (error: unknown) {
      logError("클럽 전적 조회", error);
      setMatches([]);
      setClubStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case "WIN":
        return "bg-green-100 text-green-700";
      case "LOSE":
        return "bg-red-100 text-red-600";
      case "DRAW":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "WIN":
        return "W";
      case "LOSE":
        return "L";
      case "DRAW":
        return "D";
      default:
        return "-";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 내 팀 표시 (나 + 파트너)
  const renderMyTeam = (match: MyRecentMatchResponse) => {
    const parts: React.ReactNode[] = [
      <span key="me" className="font-bold text-primary">{myName}</span>
    ];
    if (match.myPartnerName) {
      parts.push(<span key="sep1">, </span>);
      parts.push(<span key="partner">{match.myPartnerName}</span>);
    }
    return parts;
  };

  // 상대 팀 표시
  const renderOpponentTeam = (match: MyRecentMatchResponse) => {
    if (match.opponent2Name) {
      return `${match.opponent1Name}, ${match.opponent2Name}`;
    }
    return match.opponent1Name;
  };

  const handleViewAll = () => {
    navigate("/scoreboard");
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(next);
      return;
    }
    setInternalExpanded(next);
  };

  return (
    <div className="border border-border rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 cursor-pointer text-foreground hover:text-primary transition-colors"
          onClick={handleToggleExpand}
        >
          <TrophyIcon size={16} />
          <span className="text-sm font-semibold">
            나의 클럽 전적
          </span>
          {isExpanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
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
          {isLoading && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          )}

          {!isLoading && !clubStats?.totalMatches && matches.length === 0 && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              경기 기록이 없습니다
            </div>
          )}

          {!isLoading && clubStats && clubStats.totalMatches > 0 && (
            <>
              {/* 누적 전적 요약 */}
              <div className="flex items-center justify-center gap-4 py-3 bg-muted/50 rounded-lg mb-3">
                <span className="text-sm font-semibold text-green-700">
                  {clubStats.wins}승
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {clubStats.draws}무
                </span>
                <span className="text-sm font-semibold text-red-600">
                  {clubStats.losses}패
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  총 {clubStats.totalMatches}경기
                </span>
              </div>

              {/* 최근 경기 목록 */}
              {matches.length > 0 && (
                <div className="flex flex-col gap-2">
                  {matches.map((match) => (
                    <div
                      key={match.matchId}
                      className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg text-sm min-h-[44px]"
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getResultBadgeColor(match.result)}`}
                      >
                        {getResultLabel(match.result)}
                      </span>
                      <span className="text-muted-foreground text-xs min-w-[40px]">
                        {formatDate(match.playedAt)}
                      </span>
                      <span className="flex-1 flex items-center gap-0.5 text-foreground whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                        <span className="inline">
                          {renderMyTeam(match)}
                        </span>
                        <span className="text-muted-foreground text-xs mx-0.5">vs</span>
                        <span className="inline">
                          {renderOpponentTeam(match)}
                        </span>
                      </span>
                      <span className="text-foreground font-medium whitespace-nowrap">
                        {match.myTeamScore}:{match.opponentTeamScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRecentMatchesWidget;
