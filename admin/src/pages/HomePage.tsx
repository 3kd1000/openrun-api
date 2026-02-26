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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          OpenRun 백오피스 관리 시스템입니다.
        </p>
      </div>

      {/* 사용자 통계 섹션 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">사용자 통계</h3>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
        )}

        {error && (
          <div className="py-8 text-center text-destructive">{error}</div>
        )}

        {stats && !loading && (
          <div className="space-y-4">
            {/* 전체 현황 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-primary text-primary-foreground border-primary">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-primary-foreground/90">전체 사용자</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500 text-white border-emerald-500">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalClubs.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/90">전체 클럽</div>
                </CardContent>
              </Card>
            </div>

            {/* 활성 사용자 지표 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 mt-2">활성 사용자</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.dau.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">DAU (오늘)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.wau.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">WAU (7일)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.mau.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">MAU (30일)</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 신규 가입자 지표 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 mt-2">신규 가입자</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.newUsersToday.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">오늘</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.newUsersThisWeek.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">이번 주</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 text-center">
                    <div className="text-2xl font-bold mb-1 text-foreground">
                      {stats.newUsersThisMonth.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">이번 달</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 통계 히스토리 차트 섹션 */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">통계 추이</h3>
          <div className="flex gap-1.5">
            {(["1M", "3M", "6M", "1Y"] as Period[]).map((period) => (
              <Button
                key={period}
                size="sm"
                variant={selectedPeriod === period ? "default" : "outline"}
                className={cn(
                  "text-xs px-3",
                  selectedPeriod === period
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setSelectedPeriod(period)}
              >
                {periodLabels[period]}
              </Button>
            ))}
          </div>
        </div>

        {historyLoading && (
          <div className="py-8 text-center text-muted-foreground rounded-lg border bg-card">
            로딩 중...
          </div>
        )}

        {historyError && (
          <div className="py-8 text-center text-destructive rounded-lg border bg-card">
            {historyError}
          </div>
        )}

        {history && !historyLoading && history.items.length > 0 && (
          <div className="space-y-4">
            {/* 요약 정보 */}
            {history.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">사용자 증가</span>
                    <span className={cn(
                      "text-lg font-bold",
                      history.summary.userGrowth >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      {history.summary.userGrowth >= 0 ? "+" : ""}{history.summary.userGrowth.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">클럽 증가</span>
                    <span className={cn(
                      "text-lg font-bold",
                      history.summary.clubGrowth >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      {history.summary.clubGrowth >= 0 ? "+" : ""}{history.summary.clubGrowth.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">평균 DAU</span>
                    <span className="text-lg font-bold text-foreground">
                      {history.summary.avgDau.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">기간 내 신규가입</span>
                    <span className="text-lg font-bold text-foreground">
                      {history.summary.totalNewUsers.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 활성 사용자 차트 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  활성 사용자 (DAU / WAU / MAU)
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* 누적 사용자/클럽 차트 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  누적 현황 (사용자 / 클럽)
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        )}

        {history && !historyLoading && history.items.length === 0 && (
          <div className="py-12 text-center text-muted-foreground rounded-lg border bg-card">
            아직 수집된 통계 데이터가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
