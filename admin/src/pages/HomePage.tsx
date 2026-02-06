import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getUserStats, type UserStatsResponse } from "../services/userStatsService";
import { getStatsHistory, type StatsHistoryResponse } from "../services/statsHistoryService";
import "./HomePage.css";

type Period = "1M" | "3M" | "6M" | "1Y";

function HomePage() {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 차트 관련 상태
  const [history, setHistory] = useState<StatsHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadHistory(selectedPeriod);
  }, [selectedPeriod]);

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

  const loadHistory = async (period: Period) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const data = await getStatsHistory(period);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load stats history:", err);
      setHistoryError("히스토리를 불러오는데 실패했습니다.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    if (!history?.items) return [];
    return history.items.map(item => ({
      ...item,
      date: item.date.slice(5) // "MM-DD" 형식으로 표시
    }));
  };

  const periodLabels: Record<Period, string> = {
    "1M": "1개월",
    "3M": "3개월",
    "6M": "6개월",
    "1Y": "1년"
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

      {/* 통계 히스토리 차트 섹션 */}
      <section className="chart-section">
        <div className="chart-header">
          <h3>통계 추이</h3>
          <div className="period-selector">
            {(["1M", "3M", "6M", "1Y"] as Period[]).map((period) => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? "period-btn--active" : ""}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>

        {historyLoading && (
          <div className="chart-loading">로딩 중...</div>
        )}

        {historyError && (
          <div className="chart-error">{historyError}</div>
        )}

        {history && !historyLoading && history.items.length > 0 && (
          <>
            {/* 요약 정보 */}
            {history.summary && (
              <div className="chart-summary">
                <div className="summary-item">
                  <span className="summary-label">사용자 증가</span>
                  <span className={`summary-value ${history.summary.userGrowth >= 0 ? "positive" : "negative"}`}>
                    {history.summary.userGrowth >= 0 ? "+" : ""}{history.summary.userGrowth.toLocaleString()}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">클럽 증가</span>
                  <span className={`summary-value ${history.summary.clubGrowth >= 0 ? "positive" : "negative"}`}>
                    {history.summary.clubGrowth >= 0 ? "+" : ""}{history.summary.clubGrowth.toLocaleString()}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">평균 DAU</span>
                  <span className="summary-value">{history.summary.avgDau.toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">기간 내 신규가입</span>
                  <span className="summary-value">{history.summary.totalNewUsers.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* 활성 사용자 차트 */}
            <div className="chart-container">
              <h4 className="chart-title">활성 사용자 (DAU / WAU / MAU)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="dau" name="DAU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="wau" name="WAU" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mau" name="MAU" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 누적 사용자/클럽 차트 */}
            <div className="chart-container">
              <h4 className="chart-title">누적 현황 (사용자 / 클럽)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="totalUsers" name="총 사용자" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="totalClubs" name="총 클럽" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {history && !historyLoading && history.items.length === 0 && (
          <div className="chart-empty">
            아직 수집된 통계 데이터가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
