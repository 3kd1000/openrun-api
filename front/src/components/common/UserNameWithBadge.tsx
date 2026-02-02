import React from "react";
import { useAwardWinners } from "../../contexts/AwardWinnersContext";
import "./UserNameWithBadge.css";

// 수상 타입별 라벨과 CSS 클래스
const AWARD_BADGES: Record<string, { label: string; className: string }> = {
  ATTENDANCE: { label: "참여왕", className: "award-badge--attendance" },
  POINTS: { label: "승점왕", className: "award-badge--points" },
  BOOKING: { label: "예약왕", className: "award-badge--booking" },
};

interface UserNameWithBadgeProps {
  userId: number;
  userName: string;
  className?: string;
  showBadge?: boolean;       // 뱃지 표시 여부 (기본: true)
  awardTypes?: string[];     // API에서 받은 수상 타입 목록 (우선 사용)
}

/**
 * 사용자 이름과 어워드 배지를 표시하는 컴포넌트
 * - awardTypes props가 있으면 해당 타입별 뱃지 표시
 * - awardTypes가 없으면 Context에서 수상 여부 확인
 */
const UserNameWithBadge: React.FC<UserNameWithBadgeProps> = ({
  userId,
  userName,
  className = "",
  showBadge = true,
  awardTypes,
}) => {
  const { getWinnerAwardTypes } = useAwardWinners();

  // awardTypes props가 있으면 우선 사용, 없으면 Context에서 가져옴
  const effectiveAwardTypes: string[] = awardTypes ?? (showBadge ? getWinnerAwardTypes(userId) : []);

  return (
    <span className={`user-name-with-badge ${className}`}>
      {effectiveAwardTypes.map((type) => {
        const badge = AWARD_BADGES[type];
        if (!badge) return null;
        return (
          <span key={type} className={`award-badge ${badge.className}`}>
            {badge.label}
          </span>
        );
      })}
      <span className="user-name-with-badge__name">{userName}</span>
    </span>
  );
};

export default UserNameWithBadge;
