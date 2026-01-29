import React, { useEffect, useState } from "react";
import type { MemberProfile } from "../services/api/userApi";
import { getClubMemberProfile } from "../services/api/userApi";
import { getRoleLabel, normalizeClubRole } from "../utils/role";
import { formatPhoneNumber } from "../utils/contactUtils";
import "./MemberProfileDrawer.css";

interface MemberProfileDrawerProps {
  clubId: number;
  userId: number;
  onClose: () => void;
}

const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({
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
        console.error("멤버 프로필 조회 실패:", err);
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
      // YYYY-MM-DD 형식에서 YYYY년 MM월만 표시
      const [year, month] = dateString.split("-");
      return `${year}년 ${month}월`;
    } catch {
      return dateString;
    }
  };

  const formatBirthDate = (birthDate: string | null): string => {
    if (!birthDate) return "비공개";
    // YYMMDD 형식 -> YY년 MM월 DD일
    if (birthDate.length === 6) {
      const yy = birthDate.slice(0, 2);
      const mm = birthDate.slice(2, 4);
      const dd = birthDate.slice(4, 6);
      // 50 이상이면 1900년대, 미만이면 2000년대
      const year = parseInt(yy) >= 50 ? `19${yy}` : `20${yy}`;
      return `${year}년 ${parseInt(mm)}월 ${parseInt(dd)}일`;
    }
    return birthDate;
  };

  return (
    <div className="drawer-backdrop" onClick={handleBackdropClick}>
      <div className="member-profile-drawer">
        <div className="drawer-header">
          <h2>멤버 프로필</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {loading && (
            <div className="drawer-loading">프로필을 불러오는 중...</div>
          )}

          {error && <div className="drawer-error">{error}</div>}

          {!loading && !error && profile && (
            <>
              {/* 기본 정보 */}
              <div className="profile-section">
                <h3 className="section-title">기본 정보</h3>
                <div className="profile-item">
                  <span className="profile-label">이름</span>
                  <span className="profile-value">{profile.name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">이메일</span>
                  <span className="profile-value">
                    {profile.email || "비공개"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">전화번호</span>
                  <span className="profile-value">
                    {profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "비공개"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">성별</span>
                  <span className="profile-value">
                    {getGenderLabel(profile.gender)}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">생년월일</span>
                  <span className="profile-value">
                    {formatBirthDate(profile.birthDate)}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">지역</span>
                  <span className="profile-value">
                    {profile.regionDepth1 && profile.regionDepth2
                      ? `${profile.regionDepth1} ${profile.regionDepth2}`
                      : profile.regionDepth1 || "-"}
                  </span>
                </div>
              </div>

              {/* 클럽 정보 */}
              <div className="profile-section">
                <h3 className="section-title">클럽 정보</h3>
                <div className="profile-item">
                  <span className="profile-label">역할</span>
                  <span className="profile-value">
                    {getRoleLabel(normalizeClubRole(profile.role))}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">가입일</span>
                  <span className="profile-value">
                    {formatDate(profile.joinedAt)}
                  </span>
                </div>
              </div>

              {/* 테니스 프로필 */}
              <div className="profile-section">
                <h3 className="section-title">테니스 프로필</h3>
                <div className="profile-item">
                  <span className="profile-label">테니스 시작시기</span>
                  <span className="profile-value">
                    {formatMonthOnly(profile.tennisStartedAt)}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">NTRP</span>
                  <span className="profile-value">{profile.ntrp || "-"}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">선출여부</span>
                  <span className="profile-value">
                    {profile.formerPlayer ? "O" : "X"}
                  </span>
                </div>
                {profile.tournamentHistory && (
                  <div className="profile-item profile-item--full">
                    <span className="profile-label">입상 경력</span>
                    <span className="profile-value profile-value--multiline">
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
