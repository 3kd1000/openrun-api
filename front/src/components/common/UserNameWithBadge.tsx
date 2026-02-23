import React from "react";
import { Flame, Trophy, CalendarCheck, type LucideIcon } from "lucide-react";
import { useAwardWinners } from "../../contexts/AwardWinnersContext";
import { awardService, type TierName } from "../../services/awardService";
import type { AwardType } from "../../types/club";

// 어워드 타입별 설정: 아이콘 + 라벨
const AWARD_CONFIG: Record<AwardType, { label: string; Icon: LucideIcon }> = {
  ATTENDANCE: { label: "참여왕", Icon: Flame },
  POINTS: { label: "승점왕", Icon: Trophy },
  BOOKING: { label: "예약왕", Icon: CalendarCheck },
};

// 티어별 링 스타일 (차콜/secondary 톤)
const TIER_RING: Record<TierName, string> = {
  bronze: "",
  silver: "ring-1 ring-secondary/30",
  gold: "ring-1 ring-secondary/50",
  platinum: "ring-2 ring-secondary/60 shadow-sm",
  rainbow: "ring-2 ring-secondary shadow-md",
};

interface UserNameWithBadgeProps {
  userId: number | null;
  userName: string;
  className?: string;
  showBadge?: boolean;
  awardTypes?: AwardType[] | string[];
  showTier?: boolean;
  showPrimaryOnly?: boolean;
}

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

  const renderBadge = (type: AwardType, tierName?: TierName) => {
    const config = AWARD_CONFIG[type];
    if (!config) return null;
    const { label, Icon } = config;
    const ringClass = tierName ? (TIER_RING[tierName] ?? "") : "";

    return (
      <span
        key={type}
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-secondary text-white text-[11px] font-semibold whitespace-nowrap ${ringClass}`}
        title={tierName ? `${label} (${getTierLabel(tierName)})` : label}
      >
        <Icon size={12} />
        {label}
      </span>
    );
  };

  // 게스트(userId=null)이면 뱃지 없이 이름만 표시
  if (userId == null) {
    return <span className={className}>{userName}</span>;
  }

  // 대표 뱃지만 표시 모드
  if (showPrimaryOnly && showBadge) {
    const primaryBadge = getUserPrimaryBadge(userId);
    return (
      <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
        {primaryBadge && renderBadge(primaryBadge.awardType, primaryBadge.tierName)}
        <span>{userName}</span>
      </span>
    );
  }

  // 현재 시즌 수상 타입
  const effectiveAwardTypes: AwardType[] = (awardTypes as AwardType[]) ??
    (showBadge ? getWinnerAwardTypes(userId) as AwardType[] : []);

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {effectiveAwardTypes.map((type) => {
        const tier = showTier ? getUserTier(userId, type) : 0;
        const tierName: TierName = tier > 0 ? awardService.getTierName(tier) : "bronze";
        return renderBadge(type, showTier && tier > 0 ? tierName : undefined);
      })}
      <span>{userName}</span>
    </span>
  );
};

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
