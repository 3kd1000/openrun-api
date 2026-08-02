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

// 티어별 링 스타일 (게임 랭크 스타일: 구리 → 슬레이트 → 암버 → 스카이블루 → 레인보우)
// secondary 톤 하나로만 진하기를 달리하던 기존 방식은 배지 배경(역시 secondary)과
// 겹쳐 잘 안 보였어서, 등급별로 구분되는 색을 직접 지정한다.
const TIER_RING: Record<TierName, string> = {
  bronze: "ring-2 ring-[#B87333]",
  silver: "ring-2 ring-[#64748B]",
  gold: "ring-2 ring-[#F5A623]",
  platinum: "ring-2 ring-[#0EA5E9]",
  rainbow: "badge-rainbow-ring", // 그라데이션 링은 ring 유틸이 아닌 별도 CSS(::before 마스크)로 처리
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
  const { getWinnerAwardTypes, getCumulativeAwardTypes, getUserTier, getUserPrimaryBadge } = useAwardWinners();

  // 뱃지는 역대 한 번이라도 수상했으면 계속 노출(누적), 티어 링으로 횟수를 차등 표현하고,
  // 그 중 직전 시즌 수상 타입에는 코너 점(dot)으로 하이라이트를 추가로 얹는다.
  const renderBadge = (type: AwardType, tierName?: TierName, isCurrent?: boolean) => {
    const config = AWARD_CONFIG[type];
    if (!config) return null;
    const { label, Icon } = config;
    const ringClass = tierName ? (TIER_RING[tierName] ?? "") : "";
    const titleParts = [label];
    if (tierName) titleParts.push(`(${getTierLabel(tierName)})`);
    if (isCurrent) titleParts.push("· 직전 시즌 수상");

    return (
      <span
        key={type}
        className={`relative inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-secondary text-white text-[11px] leading-none font-semibold whitespace-nowrap ${ringClass}`}
        title={titleParts.join(" ")}
      >
        <Icon size={12} className="shrink-0" />
        <span className="icon-label-align">{label}</span>
        {isCurrent && (
          <span className="absolute -top-0.5 -right-0.5 flex w-1.5 h-1.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-white" />
          </span>
        )}
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
    const isCurrent = !!primaryBadge && getWinnerAwardTypes(userId).includes(primaryBadge.awardType);
    return (
      <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
        {primaryBadge && renderBadge(primaryBadge.awardType, primaryBadge.tierName, isCurrent)}
        <span>{userName}</span>
      </span>
    );
  }

  // 역대 수상 타입 전부(누적) - 직전 시즌 수상 타입만 별도로 하이라이트
  const effectiveAwardTypes: AwardType[] = (awardTypes as AwardType[]) ??
    (showBadge ? getCumulativeAwardTypes(userId) : []);
  const currentAwardTypes = showBadge ? getWinnerAwardTypes(userId) : [];

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {effectiveAwardTypes.map((type) => {
        const tier = showTier ? getUserTier(userId, type) : 0;
        const tierName: TierName = tier > 0 ? awardService.getTierName(tier) : "bronze";
        const isCurrent = currentAwardTypes.includes(type);
        return renderBadge(type, showTier && tier > 0 ? tierName : undefined, isCurrent);
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
