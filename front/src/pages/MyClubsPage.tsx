import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { MyClub } from "../services/api/userApi";
import { getMyClubs } from "../services/api/userApi";
import axiosInstance from "../services/api/axiosInstance";
import { isNotEmpty } from "../utils/isEmpty";
import "./MyClubsPage.css";

const MyClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingClubId, setLeavingClubId] = useState<number | null>(null);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const data = await getMyClubs();
      setClubs(data);
    } catch (error) {
      console.error("내 클럽 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveClub = async (clubId: number, clubName: string) => {
    if (!confirm(`'${clubName}' 클럽에서 탈퇴하시겠습니까?`)) {
      return;
    }

    setLeavingClubId(clubId);
    try {
      await axiosInstance.delete(`/clubs/${clubId}/members/me`);
      alert("클럽 탈퇴가 완료되었습니다.");
      loadClubs(); // 목록 새로고침
    } catch (error: any) {
      console.error("클럽 탈퇴 실패:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("클럽 탈퇴에 실패했습니다.");
      }
    } finally {
      setLeavingClubId(null);
    }
  };

  return (
    <div className="my-clubs-page">
      <div className="my-clubs-content">
        <div className="my-clubs-header">
          <button className="back-btn" onClick={() => navigate("/more")}>
            ← 뒤로
          </button>
          <h1>가입한 클럽</h1>
        </div>

        {isLoading ? (
          <div className="loading">로딩 중...</div>
        ) : clubs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🏟️</p>
            <p className="empty-message">가입한 클럽이 없습니다.</p>
          </div>
        ) : (
          <div className="clubs-list">
            {clubs.map((club) => (
              <div key={club.id} className="club-card">
                <div className="club-card-header">
                  <div className="club-icon">🏟️</div>
                  <div className="club-info">
                    <div className="club-name">{club.name}</div>
                    {isNotEmpty(club.description) && (
                      <div className="club-description">{club.description}</div>
                    )}
                  </div>
                </div>
                <div className="club-card-actions">
                  <button
                    className="btn-go-club"
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    바로가기
                  </button>
                  <button
                    className="btn-leave-club"
                    onClick={() => handleLeaveClub(club.id, club.name)}
                    disabled={leavingClubId === club.id}
                  >
                    {leavingClubId === club.id ? "처리중..." : "탈퇴"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClubsPage;
