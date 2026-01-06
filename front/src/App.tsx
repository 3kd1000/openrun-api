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
import LicensePage from "./pages/LicensePage";
import OAuthProvidersPage from "./pages/OAuthProvidersPage";
import MyClubsPage from "./pages/MyClubsPage";
import Navigation from "./components/common/Navigation";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { usePWAUpdate } from "./hooks/usePWAUpdate";
import { AuthProvider } from "./contexts/AuthContext";
import "./App.css";

function App() {
  const location = useLocation();
  const { needRefresh, updateServiceWorker } = usePWAUpdate();

  // "/" 경로와 "/setup-profile", "/terms"에서는 Navigation 숨김
  const shouldShowNavigation =
    location.pathname !== "/" &&
    location.pathname !== "/setup-profile" &&
    location.pathname !== "/terms";

  return (
    <AuthProvider>
      <div className="App">
        {/* <DevUserSwitcher /> */}
        {shouldShowNavigation && <Navigation />}
        <main
          className={`App-content ${
            !shouldShowNavigation ? "no-navigation" : ""
          }`}
        >
          <div className="App-content-wrapper">
            <Routes>
              {/* Public 페이지 (로그인 불필요) */}
              <Route path="/" element={<DrawGenerationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/license" element={<LicensePage />} />
              <Route path="/clubs" element={<ClubListPage />} />
              <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
              <Route path="/home" element={<ComingSoonPage title="홈" />} />
              <Route path="/more" element={<MorePage />} />
              <Route
                path="/more/oauth-providers"
                element={<OAuthProvidersPage />}
              />
              <Route path="/more/my-clubs" element={<MyClubsPage />} />
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

        {/* PWA 주석 테스트*/}

        {/* PWA 업데이트 프롬프트 주석 */}
        {needRefresh && <PWAUpdatePrompt onUpdate={updateServiceWorker} />}
      </div>
    </AuthProvider>
  );
}

export default App;
