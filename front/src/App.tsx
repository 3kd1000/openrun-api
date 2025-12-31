import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import DrawGenerationPage from "./pages/draw/DrawGenerationPage";
import ScheduleListPage from "./pages/schedule/ScheduleListPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import MorePage from "./pages/MorePage";
import ScoreboardPage from "./pages/scoreboard/ScoreboardPage";
import AuthTestPage from "./pages/AuthTestPage";
import LoginPage from "./pages/LoginPage";
import SetupProfilePage from "./pages/SetupProfilePage";
import DevAuthPage from "./pages/DevAuthPage";
import ClubListPage from "./pages/club/ClubListPage";
import ClubDetailPage from "./pages/club/ClubDetailPage";
import ClubAdminPage from "./pages/club/ClubAdminPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import Navigation from "./components/common/Navigation";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { setupAuthListener } from "./services/firebase";
import { getTimestamp } from "./utils/dateUtils";
import "./App.css";

function App() {
  const location = useLocation();

  // Firebase 자동 로그인 및 토큰 갱신 설정
  useEffect(() => {
    const now = getTimestamp();
    console.log(`🔧 [${now}] Firebase 자동 토큰 갱신 리스너 설정`);
    setupAuthListener((token) => {
      const refreshTime = getTimestamp();
      console.log(`🔄 [${refreshTime}] 토큰 갱신됨 (App.tsx)`);
      console.log(token);
    });
  }, []);

  // "/" 경로와 "/setup-profile", "/terms"에서는 Navigation 숨김
  const shouldShowNavigation =
    location.pathname !== "/" &&
    location.pathname !== "/setup-profile" &&
    location.pathname !== "/terms";

  return (
    <div className="App">
      {/* <DevUserSwitcher /> */}
      {shouldShowNavigation && <Navigation />}
      <main className="App-content">
        <div className="App-content-wrapper">
          <Routes>
            {/* Public 페이지 (로그인 불필요) */}
            <Route path="/" element={<DrawGenerationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/clubs" element={<ClubListPage />} />
            <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
            <Route path="/home" element={<ComingSoonPage title="홈" />} />
            <Route path="/more" element={<MorePage />} />
            {/* Protected 페이지 (로그인 필수) */}
            <Route
              path="/schedules"
              element={
                <ProtectedRoute>
                  <ScheduleListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scoreboard"
              element={
                <ProtectedRoute>
                  <ScoreboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup-profile"
              element={
                <ProtectedRoute>
                  <SetupProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/:clubId/admin"
              element={
                <ProtectedRoute>
                  <ClubAdminPage />
                </ProtectedRoute>
              }
            />

            {/* 개발용 페이지 */}
            <Route path="/auth-test" element={<AuthTestPage />} />
            <Route path="/dev/login" element={<DevAuthPage />} />
          </Routes>
        </div>
      </main>
      {/* 네비게이션 바가 있을 때는 Footer 숨김 (네비게이션 바에 통합) */}
      {!shouldShowNavigation && <Footer />}
    </div>
  );
}

export default App;
