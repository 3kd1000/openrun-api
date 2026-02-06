import React from "react";
import { useAwardWinners } from "../../contexts/AwardWinnersContext";
import { awardService, type TierName } from "../../services/awardService";
import type { AwardType } from "../../types/club";
import "./UserNameWithBadge.css";

// 수상 타입별 라벨
const AWARD_LABELS: Record<AwardType, string> = {
  ATTENDANCE: "참여왕",
  POINTS: "승점왕",
  BOOKING: "예약왕",
};

interface UserNameWithBadgeProps {
  userId: number;
  userName: string;
  className?: string;
  showBadge?: boolean;       // 뱃지 표시 여부 (기본: true)
  awardTypes?: AwardType[] | string[];  // 현재 시즌 수상 타입 (직접 전달 시)
  showTier?: boolean;        // 티어 테두리 표시 여부 (기본: true)
  showPrimaryOnly?: boolean; // 대표 뱃지만 표시 (기본: false)
}

/**
 * 사용자 이름과 어워드 배지를 표시하는 컴포넌트
 *
 * - 현재 시즌 수상자: 뱃지 표시 (참여왕, 승점왕, 예약왕)
 * - 티어 시스템: 누적 수상 횟수에 따른 테두리 스타일
 *   - 1회: 브론즈
 *   - 2회: 실버
 *   - 3회: 골드
 *   - 4회: 플래티넘
 *   - 5회+: 레인보우
 * - showPrimaryOnly=true: 가장 높은 티어의 대표 뱃지만 표시
 */
const UserNameWithBadge: React.FC<UserNameWithBadgeProps> = ({
  userId,
  userName,
  className = "",
  showBadge = true,
  awardTypes,
  showTier = true,
  showPrimaryOnly = false,
}) => {
  const { getWinnerAwardTypes, getUserTier, getUserPrimaryBadge } = useAwardWinners();

  // 대표 뱃지만 표시 모드
  if (showPrimaryOnly && showBadge) {
    const primaryBadge = getUserPrimaryBadge(userId);

    if (primaryBadge) {
      const label = AWARD_LABELS[primaryBadge.awardType];
      return (
        <span className={`user-name-with-badge ${className}`}>
          <span
            className={`award-badge award-badge--${primaryBadge.awardType.toLowerCase()} award-badge--tier-${primaryBadge.tierName}`}
            title={`${label} (${getTierLabel(primaryBadge.tierName)})`}
          >
            {label}
          </span>
          <span className="user-name-with-badge__name">{userName}</span>
        </span>
      );
    }

    return (
      <span className={`user-name-with-badge ${className}`}>
        <span className="user-name-with-badge__name">{userName}</span>
      </span>
    );
  }

  // 현재 시즌 수상 타입 (props 우선, 없으면 Context에서)
  const effectiveAwardTypes: AwardType[] = (awardTypes as AwardType[]) ??
    (showBadge ? getWinnerAwardTypes(userId) as AwardType[] : []);

  return (
    <span className={`user-name-with-badge ${className}`}>
      {effectiveAwardTypes.map((type) => {
        const label = AWARD_LABELS[type];
        if (!label) return null;

        // 티어 계산 (누적 횟수 기반)
        const tier = showTier ? getUserTier(userId, type) : 0;
        const tierName: TierName = tier > 0 ? awardService.getTierName(tier) : "bronze";
        const tierClass = showTier && tier > 0 ? `award-badge--tier-${tierName}` : "";

        return (
          <span
            key={type}
            className={`award-badge award-badge--${type.toLowerCase()} ${tierClass}`}
            title={tier > 0 ? `${label} (${getTierLabel(tierName)})` : label}
          >
            {label}
          </span>
        );
      })}
      <span className="user-name-with-badge__name">{userName}</span>
    </span>
  );
};

// 티어 한글명
function getTierLabel(tierName: TierName): string {
  switch (tierName) {
    case "bronze": return "브론즈";
    case "silver": return "실버";
    case "gold": return "골드";
    case "platinum": return "플래티넘";
    case "rainbow": return "레인보우";
    default: return "";
  }
}

export default UserNameWithBadge;
