import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { MemberProfile } from "../../../services/api/userApi";
import { getClubMemberProfile } from "../../../services/api/userApi";
import { getRoleLabel, normalizeClubRole } from "../../../utils/role";
import { formatPhoneNumber } from "../../../utils/contactUtils";
import { awardService, type AwardWinnerResponse } from "../../../services/awardService";
import type { AwardType } from "../../../types/club";
import { cn } from "../../../lib/utils";
import BackButton from "../../../components/common/BackButton";

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

// Achievement tag tier styles
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

const getGenderLabel = (gender: string | null | undefined): string => {
  if (!gender || gender === "PRIVATE") return "비공개";
  switch (gender) {
    case "MALE": return "남자";
    case "FEMALE": return "여자";
    default: return "비공개";
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

const MemberProfilePage: React.FC = () => {
  const { clubId, userId } = useParams<{ clubId: string; userId: string }>();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awardHistory, setAwardHistory] = useState<GroupedAward[]>([]);

  useEffect(() => {
    if (!clubId || !userId) return;

    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, awardsData] = await Promise.all([
          getClubMemberProfile(Number(clubId), Number(userId)),
          awardService.getUserAchievements(Number(clubId), Number(userId)).catch(() => []),
        ]);

        if (!mounted) return;
        setProfile(profileData);
        setAwardHistory(groupAwardsByType(awardsData));
      } catch (err: unknown) {
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

  // 공유 스타일 (ProfileEditPage 디자인 언어 참조)
  const sectionTitle = "flex items-center gap-2 text-base font-bold text-secondary mb-4";
  const fieldLabel = "text-xs font-semibold text-secondary mb-1";
  const fieldValue = "text-sm text-foreground border-b border-border pb-2";

  return (
    <div className="page-container">
      {/* 헤더 - ProfileEditPage 스타일 */}
      <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between -mx-3 -mt-0 mb-4 rounded-b-2xl">
        <BackButton className="text-white" />
        <span className="text-sm font-bold">멤버 프로필</span>
        <div className="w-9" />
      </div>

      {loading && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          프로필을 불러오는 중...
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">
          {error}
        </div>
      )}

      {!loading && !error && profile && (
        <div className="px-1">
          {/* ━━ 섹션 1: 기본 정보 ━━ */}
          <div className={sectionTitle}>
            <div className="w-1 h-5 bg-primary rounded-full" />
            기본 정보
          </div>

          <div className="mb-5">
            {/* 이름 + 성별 (한 줄) */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>이름</div>
                <div className={fieldValue}>{profile.name}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>성별</div>
                <div className={fieldValue}>{getGenderLabel(profile.gender)}</div>
              </div>
            </div>

            {/* 전화번호 + 생년월일 (한 줄) */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>전화번호</div>
                <div className={fieldValue}>
                  {profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "비공개"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>생년월일</div>
                <div className={fieldValue}>{formatBirthDate(profile.birthDate)}</div>
              </div>
            </div>

            {/* 이메일 */}
            <div className="mb-3">
              <div className={fieldLabel}>이메일</div>
              <div className={fieldValue}>{profile.email || "비공개"}</div>
            </div>

            {/* 지역 */}
            <div>
              <div className={fieldLabel}>지역</div>
              <div className={cn(fieldValue, "border-b-0 pb-0")}>
                {profile.regionDepth1 && profile.regionDepth2
                  ? `${profile.regionDepth1} ${profile.regionDepth2}`
                  : profile.regionDepth1 || "-"}
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border my-5" />

          {/* ━━ 섹션 2: 클럽 정보 ━━ */}
          <div className={sectionTitle}>
            <div className="w-1 h-5 bg-primary rounded-full" />
            클럽 정보
          </div>

          <div className="mb-5">
            {/* 역할 + 가입일 (한 줄) */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>역할</div>
                <div className={fieldValue}>
                  {getRoleLabel(normalizeClubRole(profile.role))}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>가입일</div>
                <div className={fieldValue}>{formatDate(profile.joinedAt)}</div>
              </div>
            </div>

            {/* 클럽 업적 */}
            {awardHistory.length > 0 && (
              <div>
                <div className={fieldLabel}>클럽 업적</div>
                <div className="flex flex-wrap gap-1 mt-1">
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

          {/* 구분선 */}
          <div className="border-t border-border my-5" />

          {/* ━━ 섹션 3: 테니스 프로필 ━━ */}
          <div className={sectionTitle}>
            <div className="w-1 h-5 bg-primary rounded-full" />
            테니스 프로필
          </div>

          <div className="mb-5">
            {/* 시작시기 + NTRP (한 줄) */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>테니스 시작시기</div>
                <div className={fieldValue}>{formatMonthOnly(profile.tennisStartedAt)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={fieldLabel}>NTRP</div>
                <div className={fieldValue}>{profile.ntrp || "-"}</div>
              </div>
            </div>

            {/* 선출여부 */}
            <div className="mb-3">
              <div className={fieldLabel}>선출여부</div>
              <div className={fieldValue}>{profile.formerPlayer ? "선수출신" : "일반인(동호인)"}</div>
            </div>

            {/* 입상 경력 */}
            {profile.tournamentHistory && (
              <div>
                <div className={fieldLabel}>입상 경력</div>
                <div className={cn(fieldValue, "whitespace-pre-wrap border-b-0 pb-0")}>
                  {profile.tournamentHistory}
                </div>
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      )}
    </div>
  );
};

export default MemberProfilePage;
