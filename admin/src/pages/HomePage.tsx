import { useEffect, useState } from "react";
import { getUserStats, type UserStatsResponse } from "../services/userStatsService";
import "./HomePage.css";

function HomePage() {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load user stats:", err);
      setError("통계를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h2>Dashboard</h2>
      <p className="home-page__description">
        OpenRun 백오피스 관리 시스템입니다.
      </p>

      {/* 사용자 통계 섹션 */}
      <section className="stats-section">
        <h3>사용자 통계</h3>

        {loading && (
          <div className="stats-loading">로딩 중...</div>
        )}

        {error && (
          <div className="stats-error">{error}</div>
        )}

        {stats && !loading && (
          <>
            {/* 전체 현황 */}
            <div className="stats-grid stats-grid--overview">
              <div className="stat-card stat-card--primary">
                <div className="stat-card__value">{stats.totalUsers.toLocaleString()}</div>
                <div className="stat-card__label">전체 사용자</div>
              </div>
              <div className="stat-card stat-card--secondary">
                <div className="stat-card__value">{stats.totalClubs.toLocaleString()}</div>
                <div className="stat-card__label">전체 클럽</div>
              </div>
            </div>

            {/* 활성 사용자 지표 */}
            <h4 className="stats-subtitle">활성 사용자</h4>
            <div className="stats-grid stats-grid--secondary">
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.dau.toLocaleString()}</div>
                <div className="stat-card__label">DAU (오늘)</div>
              </div>
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.wau.toLocaleString()}</div>
                <div className="stat-card__label">WAU (7일)</div>
              </div>
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.mau.toLocaleString()}</div>
                <div className="stat-card__label">MAU (30일)</div>
              </div>
            </div>

            {/* 신규 가입자 지표 */}
            <h4 className="stats-subtitle">신규 가입자</h4>
            <div className="stats-grid stats-grid--secondary">
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.newUsersToday.toLocaleString()}</div>
                <div className="stat-card__label">오늘</div>
              </div>
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.newUsersThisWeek.toLocaleString()}</div>
                <div className="stat-card__label">이번 주</div>
              </div>
              <div className="stat-card stat-card--small">
                <div className="stat-card__value">{stats.newUsersThisMonth.toLocaleString()}</div>
                <div className="stat-card__label">이번 달</div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 바로가기 카드 섹션 */}
      <section className="cards-section">
        <h3>바로가기</h3>
        <div className="home-page__cards">
          <div className="dashboard-card">
            <h4>Audit Logs</h4>
            <p>Schedule, Club, ClubMember 변경 이력 조회</p>
          </div>
          <div className="dashboard-card">
            <h4>Push 알림</h4>
            <p>사용자에게 푸시 알림 발송</p>
          </div>
          <div className="dashboard-card">
            <h4>문의 관리</h4>
            <p>사용자 문의 확인 및 답변</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
