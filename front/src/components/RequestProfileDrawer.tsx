import React, { useEffect, useState } from "react";
import type { MemberProfile } from "../services/api/userApi";
import { getClubMemberProfile } from "../services/api/userApi";
import "./RequestProfileDrawer.css";

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
      // YYYY-MM-DD 형식에서 YYYY년 MM월만 표시
      const [year, month] = dateString.split("-");
      return `${year}년 ${month}월`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="drawer-backdrop" onClick={handleBackdropClick}>
      <div className="request-profile-drawer">
        <div className="drawer-header">
          <h2>신청자 프로필</h2>
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
                  <span className="profile-label">성별</span>
                  <span className="profile-value">
                    {getGenderLabel(profile.gender)}
                  </span>
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
                    {profile.phoneNumber || "비공개"}
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

export default RequestProfileDrawer;
