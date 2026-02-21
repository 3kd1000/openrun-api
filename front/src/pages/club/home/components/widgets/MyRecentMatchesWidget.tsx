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
import "./MyRecentMatchesWidget.css";

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

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case "WIN":
        return "my-recent-matches-widget__result-badge--win";
      case "LOSE":
        return "my-recent-matches-widget__result-badge--lose";
      case "DRAW":
        return "my-recent-matches-widget__result-badge--draw";
      default:
        return "";
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
      <span key="me" className="my-recent-matches-widget__player--me">{myName}</span>
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
    <div className="my-recent-matches-widget">
      <div className="my-recent-matches-widget__header">
        <button
          className="my-recent-matches-widget__header-left"
          onClick={handleToggleExpand}
        >
          <TrophyIcon size={16} />
          <span className="my-recent-matches-widget__title">
            나의 클럽 전적
          </span>
          {isExpanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
        </button>
        <button
          className="my-recent-matches-widget__view-all"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="my-recent-matches-widget__content">
          {isLoading && (
            <div className="my-recent-matches-widget__loading">
              불러오는 중...
            </div>
          )}

          {!isLoading && !clubStats?.totalMatches && matches.length === 0 && (
            <div className="my-recent-matches-widget__empty">
              경기 기록이 없습니다
            </div>
          )}

          {!isLoading && clubStats && clubStats.totalMatches > 0 && (
            <>
              {/* 누적 전적 요약 */}
              <div className="my-recent-matches-widget__summary">
                <span className="my-recent-matches-widget__summary-item my-recent-matches-widget__summary-item--win">
                  {clubStats.wins}승
                </span>
                <span className="my-recent-matches-widget__summary-item my-recent-matches-widget__summary-item--draw">
                  {clubStats.draws}무
                </span>
                <span className="my-recent-matches-widget__summary-item my-recent-matches-widget__summary-item--lose">
                  {clubStats.losses}패
                </span>
                <span className="my-recent-matches-widget__summary-item my-recent-matches-widget__summary-item--total">
                  총 {clubStats.totalMatches}경기
                </span>
              </div>

              {/* 최근 경기 목록 */}
              {matches.length > 0 && (
                <div className="my-recent-matches-widget__list">
                  {matches.map((match) => (
                    <div
                      key={match.matchId}
                      className="my-recent-matches-widget__item"
                    >
                      <span
                        className={`my-recent-matches-widget__result-badge ${getResultBadgeClass(
                          match.result
                        )}`}
                      >
                        {getResultLabel(match.result)}
                      </span>
                      <span className="my-recent-matches-widget__date">
                        {formatDate(match.playedAt)}
                      </span>
                      <span className="my-recent-matches-widget__players">
                        <span className="my-recent-matches-widget__my-team">
                          {renderMyTeam(match)}
                        </span>
                        <span className="my-recent-matches-widget__vs">vs</span>
                        <span className="my-recent-matches-widget__opponent-team">
                          {renderOpponentTeam(match)}
                        </span>
                      </span>
                      <span className="my-recent-matches-widget__score">
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
