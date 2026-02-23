import React, { useEffect, useState } from "react";
import type { MemberProfile } from "../services/api/userApi";
import { getClubMemberProfile } from "../services/api/userApi";
import { cn } from "../lib/utils";

interface RequestProfileDrawerProps {
  clubId: number;
  userId: number;
  onClose: () => void;
}

const RequestProfileDrawer: React.FC<RequestProfileDrawerProps> = ({
  clubId,
  userId,
  onClose,
}) => {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getClubMemberProfile(clubId, userId);
        if (!mounted) return;
        setProfile(data);
      } catch (err) {
        if (!mounted) return;
        console.error("프로필 조회 실패:", err);
        setError("프로필을 불러오는데 실패했습니다.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

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

  const formatMonthOnly = (dateString: string | null): string => {
    if (!dateString) return "-";
    try {
      const [year, month] = dateString.split("-");
      return `${year}년 ${month}월`;
    } catch {
      return dateString;
    }
  };

  // Profile item: grid with label col on desktop, stacked on smallest screens
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
          // Desktop: right-side drawer, slide in from right
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
            신청자 프로필
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className={cn(
            "px-6 py-5",
            "max-[768px]:px-4 max-[768px]:py-4",
            "max-[425px]:px-4 max-[425px]:py-4",
            "max-[359px]:px-3 max-[359px]:py-3"
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
                  <span className={profileLabelClass}>성별</span>
                  <span className={profileValueClass}>
                    {getGenderLabel(profile.gender)}
                  </span>
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
                    {profile.phoneNumber || "비공개"}
                  </span>
                </div>
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

export default RequestProfileDrawer;
