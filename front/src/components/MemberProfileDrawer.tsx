import React, { useEffect, useState } from "react";
import type { MemberProfile } from "../services/api/userApi";
import { getClubMemberProfile } from "../services/api/userApi";
import { getRoleLabel, normalizeClubRole } from "../utils/role";
import { formatPhoneNumber } from "../utils/contactUtils";
import { awardService, type AwardWinnerResponse } from "../services/awardService";
import type { AwardType } from "../types/club";
import { cn } from "../lib/utils";

interface MemberProfileDrawerProps {
  clubId: number;
  userId: number;
  onClose: () => void;
}

// 어워드 타입 한글명
const getAwardTypeLabel = (type: AwardType): string => {
  switch (type) {
    case "ATTENDANCE": return "참여왕";
    case "POINTS": return "승점왕";
    case "BOOKING": return "예약왕";
    default: return type;
  }
};

// 기간을 "2025년 상반기" 형식으로 변환
const formatPeriodLabel = (periodStart: string, periodEnd: string): string => {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const year = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;

  if (startMonth === 1 && endMonth === 6) {
    return `${year}년 상반기`;
  } else if (startMonth === 7 && endMonth === 12) {
    return `${year}년 하반기`;
  } else if (startMonth === 1 && endMonth === 12) {
    return `${year}년`;
  }
  return `${year}년 ${startMonth}~${endMonth}월`;
};

// 수상 이력을 어워드 타입별로 그룹화
interface GroupedAward {
  type: AwardType;
  count: number;
  periods: string[];
  tierName: string;
}

const groupAwardsByType = (awards: AwardWinnerResponse[]): GroupedAward[] => {
  const grouped = new Map<AwardType, { periods: string[]; count: number }>();

  for (const award of awards) {
    const type = award.awardType;
    const periodLabel = formatPeriodLabel(award.periodStart, award.periodEnd);

    if (!grouped.has(type)) {
      grouped.set(type, { periods: [], count: 0 });
    }
    const entry = grouped.get(type)!;
    entry.periods.push(periodLabel);
    entry.count++;
  }

  return Array.from(grouped.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    periods: data.periods,
    tierName: awardService.getTierName(awardService.calculateTier(data.count)),
  }));
};

// Achievement tag tier styles (requires inline style for gradient/border-image)
const getAchievementTagStyle = (tierName: string): React.CSSProperties => {
  switch (tierName) {
    case "bronze":
      return { borderLeftColor: "#CD7F32" };
    case "silver":
      return { borderLeftColor: "#C0C0C0" };
    case "gold":
      return {
        borderLeftColor: "#FFD700",
        background: "linear-gradient(135deg, rgba(255,215,0,0.08), var(--color-bg-secondary))",
      };
    case "platinum":
      return {
        borderLeftColor: "#E5E4E2",
        background: "linear-gradient(135deg, rgba(229,228,226,0.12), var(--color-bg-secondary))",
      };
    case "rainbow":
      return {
        borderLeftWidth: "4px",
        borderImage:
          "linear-gradient(180deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3) 1",
        background:
          "linear-gradient(90deg,rgba(255,0,0,0.03),rgba(255,127,0,0.03),rgba(255,255,0,0.03),rgba(0,255,0,0.03),rgba(0,0,255,0.03),var(--color-bg-secondary))",
      };
    default:
      return { borderLeftColor: "#CD7F32" };
  }
};

const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({
  clubId,
  userId,
  onClose,
}) => {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awardHistory, setAwardHistory] = useState<GroupedAward[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, awardsData] = await Promise.all([
          getClubMemberProfile(clubId, userId),
          awardService.getUserAchievements(clubId, userId).catch(() => []),
        ]);

        if (!mounted) return;
        setProfile(profileData);
        setAwardHistory(groupAwardsByType(awardsData));
      } catch (err) {
        if (!mounted) return;
        console.error("멤버 프로필 조회 실패:", err);
        setError("프로필을 불러오는데 실패했습니다.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [clubId, userId]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getGenderLabel = (gender: string | null | undefined): string => {
    if (!gender || gender === "PRIVATE") return "비공개";
    switch (gender) {
      case "MALE":
        return "남자";
      case "FEMALE":
        return "여자";
      default:
        return "비공개";
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatMonthOnly = (dateString: string | null): string => {
    if (!dateString) return "-";
    try {
      const [year, month] = dateString.split("-");
      return `${year}년 ${month}월`;
    } catch {
      return dateString;
    }
  };

  const formatBirthDate = (birthDate: string | null): string => {
    if (!birthDate) return "비공개";
    if (birthDate.length === 6) {
      const yy = birthDate.slice(0, 2);
      const mm = birthDate.slice(2, 4);
      const dd = birthDate.slice(4, 6);
      const year = parseInt(yy) >= 50 ? `19${yy}` : `20${yy}`;
      return `${year}년 ${parseInt(mm)}월 ${parseInt(dd)}일`;
    }
    return birthDate;
  };

  // Reusable profile item classes
  const profileItemClass =
    "grid [grid-template-columns:120px_1fr] gap-4 py-2 border-b border-border last:border-b-0 max-[425px]:[grid-template-columns:80px_1fr] max-[425px]:gap-2 max-[425px]:py-1 max-[359px]:[grid-template-columns:1fr] max-[359px]:gap-1 max-[359px]:py-1";
  const profileLabelClass =
    "text-xs font-semibold text-muted-foreground leading-[1.5] max-[359px]:mb-1";
  const profileValueClass =
    "text-sm text-foreground leading-[1.5] break-words max-[425px]:text-xs";

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 z-[1000] animate-[fadeIn_0.2s_ease-out]",
        "max-[425px]:flex max-[425px]:items-end"
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          // Desktop: right-side drawer
          "fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-background shadow-lg overflow-y-auto animate-[slideInRight_0.3s_ease-out]",
          // Tablet
          "max-[768px]:max-w-[380px]",
          // Mobile: bottom sheet
          "max-[425px]:relative max-[425px]:top-auto max-[425px]:right-auto max-[425px]:bottom-auto max-[425px]:max-w-full max-[425px]:max-h-[85vh] max-[425px]:rounded-t-md max-[425px]:rounded-b-none max-[425px]:animate-[slideInUp_0.3s_ease-out]",
          // Small mobile
          "max-[359px]:max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "sticky top-0 bg-background px-6 py-5 border-b border-border flex items-center justify-between z-[1]",
            "max-[768px]:px-4 max-[768px]:py-4",
            "max-[425px]:px-4 max-[425px]:py-4",
            "max-[359px]:px-3 max-[359px]:py-3"
          )}
        >
          <h2
            className={cn(
              "m-0 text-xl font-bold text-foreground",
              "max-[768px]:text-lg",
              "max-[425px]:text-base",
              "max-[359px]:text-sm"
            )}
          >
            멤버 프로필
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className={cn(
            "px-6 py-5 pb-[max(var(--space-xl),env(safe-area-inset-bottom,var(--space-l)))]",
            "max-[768px]:px-4 max-[768px]:py-4",
            "max-[425px]:px-4 max-[425px]:py-4 max-[425px]:pb-[max(var(--space-xl),calc(env(safe-area-inset-bottom,0px)+var(--space-l)))]",
            "max-[359px]:px-3 max-[359px]:py-3 max-[359px]:pb-[max(var(--space-xl),calc(env(safe-area-inset-bottom,0px)+var(--space-m)))]"
          )}
        >
          {loading && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              프로필을 불러오는 중...
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-[#fee] border border-[#fcc] rounded-sm text-[#c33] text-xs">
              {error}
            </div>
          )}

          {!loading && !error && profile && (
            <>
              {/* 기본 정보 */}
              <div className="mb-6 last:mb-0">
                <h3
                  className={cn(
                    "m-0 mb-3 text-sm font-bold text-foreground",
                    "max-[425px]:text-xs"
                  )}
                >
                  기본 정보
                </h3>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>이름</span>
                  <span className={profileValueClass}>{profile.name}</span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>이메일</span>
                  <span className={profileValueClass}>
                    {profile.email || "비공개"}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>전화번호</span>
                  <span className={profileValueClass}>
                    {profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "비공개"}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>성별</span>
                  <span className={profileValueClass}>
                    {getGenderLabel(profile.gender)}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>생년월일</span>
                  <span className={profileValueClass}>
                    {formatBirthDate(profile.birthDate)}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>지역</span>
                  <span className={profileValueClass}>
                    {profile.regionDepth1 && profile.regionDepth2
                      ? `${profile.regionDepth1} ${profile.regionDepth2}`
                      : profile.regionDepth1 || "-"}
                  </span>
                </div>
              </div>

              {/* 클럽 정보 */}
              <div className="mb-6 last:mb-0">
                <h3
                  className={cn(
                    "m-0 mb-3 text-sm font-bold text-foreground pt-4",
                    "max-[425px]:text-xs"
                  )}
                >
                  클럽 정보
                </h3>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>역할</span>
                  <span className={profileValueClass}>
                    {getRoleLabel(normalizeClubRole(profile.role))}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>가입일</span>
                  <span className={profileValueClass}>
                    {formatDate(profile.joinedAt)}
                  </span>
                </div>

                {/* 클럽 업적 */}
                {awardHistory.length > 0 && (
                  <div className={cn(profileItemClass, "items-start")}>
                    <span className={cn(profileLabelClass, "pt-1")}>클럽 업적</span>
                    <div className={cn(profileValueClass, "flex flex-col gap-1")}>
                      {awardHistory.map(({ type, count, periods, tierName }) => (
                        <div
                          key={type}
                          className="inline-block px-2 py-0.5 rounded-sm text-xs font-medium bg-muted text-foreground border-l-[3px]"
                          style={getAchievementTagStyle(tierName)}
                        >
                          <span>
                            {getAwardTypeLabel(type)} {count}회 -{" "}
                          </span>
                          <span>{periods.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 테니스 프로필 */}
              <div className="mb-6 last:mb-0">
                <h3
                  className={cn(
                    "m-0 mb-3 text-sm font-bold text-foreground pt-4",
                    "max-[425px]:text-xs"
                  )}
                >
                  테니스 프로필
                </h3>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>테니스 시작시기</span>
                  <span className={profileValueClass}>
                    {formatMonthOnly(profile.tennisStartedAt)}
                  </span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>NTRP</span>
                  <span className={profileValueClass}>{profile.ntrp || "-"}</span>
                </div>
                <div className={profileItemClass}>
                  <span className={profileLabelClass}>선출여부</span>
                  <span className={profileValueClass}>
                    {profile.formerPlayer ? "O" : "X"}
                  </span>
                </div>
                {profile.tournamentHistory && (
                  <div className="grid [grid-template-columns:1fr] gap-2 py-2 border-b border-border last:border-b-0">
                    <span className={profileLabelClass}>입상 경력</span>
                    <span className={cn(profileValueClass, "whitespace-pre-wrap mt-1")}>
                      {profile.tournamentHistory}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileDrawer;
