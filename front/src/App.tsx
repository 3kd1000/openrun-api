import { Routes, Route, useLocation } from "react-router-dom";
import DrawGenerationPage from "./pages/draw/DrawGenerationPage";
import ScheduleListPage from "./pages/schedule/ScheduleListPage";
import MorePage from "./pages/more/MorePage";
import ScoreboardPage from "./pages/scoreboard/ScoreboardPage";
import AuthTestPage from "./pages/auth/AuthTestPage";
import LoginPage from "./pages/auth/LoginPage";
import SetupProfilePage from "./pages/auth/SetupProfilePage";
import ClubListPage from "./pages/club/ClubListPage";
import ClubDetailPage from "./pages/club/ClubDetailPage";
import ClubAdminPage from "./pages/club/ClubAdminPage";
import ClubMainPage from "./pages/club/ClubMainPage";
import ClubExplorePage from "./pages/club/ClubExplorePage";
import ClubMembersPage from "./pages/club/ClubMembersPage";
import ClubManagePage from "./pages/club/ClubManagePage";
import ClubCreatePage from "./pages/club/ClubCreatePage";
import ClubManageInfoPage from "./pages/club/ClubManageInfoPage";
import ClubManagePolicyPage from "./pages/club/ClubManagePolicyPage";
import ClubCreateOnboardingPage from "./pages/club/ClubCreateOnboardingPage";
import ClubRulesPage from "./pages/club/ClubRulesPage";
import ClubNoticesManagePage from "./pages/club/ClubNoticesManagePage";
import ClubEntryRedirectPage from "./pages/club/ClubEntryRedirectPage";
import PostListPage from "./pages/club/PostListPage";
import GuestRecruitPage from "./pages/club/GuestRecruitPage";
import InterclubRecruitPage from "./pages/club/InterclubRecruitPage";
import ClubExternalRequestsPage from "./pages/club/ClubExternalRequestsPage";
import ClubJoinRequestsPage from "./pages/club/ClubJoinRequestsPage";
import ClubContentManagePage from "./pages/club/ClubContentManagePage";
import RecruitSchedulesPage from "./pages/club/RecruitSchedulesPage";
import RecruitClubsPage from "./pages/club/RecruitClubsPage";
import TermsOfServicePage from "./pages/more/TermsOfServicePage";
import LicensePage from "./pages/more/LicensePage";
import OAuthProvidersPage from "./pages/more/OAuthProvidersPage";
import MyClubsPage from "./pages/more/MyClubsPage";
import UserGuidePage from "./pages/more/UserGuidePage";
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
    location.pathname !== "/setup-profile";

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
              <Route path="/more/terms" element={<TermsOfServicePage />} />
              <Route path="/more/license" element={<LicensePage />} />
              <Route path="/clubs" element={<ClubListPage />} />
              <Route path="/clubs/explore" element={<ClubExplorePage />} />
              <Route path="/clubs/explore/recruit" element={<RecruitSchedulesPage />} />
              <Route path="/clubs/explore/recruit-clubs" element={<RecruitClubsPage />} />
              <Route
                path="/clubs/new"
                element={
                  <ProtectedRoute>
                    <ClubCreatePage />
                  </ProtectedRoute>
                }
              />
              {/* Public: 클럽 상세(가입 신청 등) */}
              <Route
                path="/clubs/:clubId/detail"
                element={<ClubDetailPage />}
              />
              <Route
                path="/clubs/:clubId/members"
                element={
                  <ProtectedRoute>
                    <ClubMembersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/rules"
                element={
                  <ProtectedRoute>
                    <ClubRulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage"
                element={
                  <ProtectedRoute>
                    <ClubManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/info"
                element={
                  <ProtectedRoute>
                    <ClubManageInfoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/policy"
                element={
                  <ProtectedRoute>
                    <ClubManagePolicyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/onboarding"
                element={
                  <ProtectedRoute>
                    <ClubCreateOnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/external-requests"
                element={
                  <ProtectedRoute>
                    <ClubExternalRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/join-requests"
                element={
                  <ProtectedRoute>
                    <ClubJoinRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/content"
                element={
                  <ProtectedRoute>
                    <ClubContentManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/notices/manage"
                element={
                  <ProtectedRoute>
                    <ClubNoticesManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/guest-recruit/:scheduleId"
                element={
                  <ProtectedRoute>
                    <GuestRecruitPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/interclub-recruit/:scheduleId"
                element={
                  <ProtectedRoute>
                    <InterclubRecruitPage />
                  </ProtectedRoute>
                }
              />
              {/* Club Home (로그인/클럽 멤버 전제) */}
              <Route
                path="/clubs/:clubId"
                element={
                  <ProtectedRoute>
                    <ClubMainPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/posts"
                element={
                  <ProtectedRoute>
                    <PostListPage />
                  </ProtectedRoute>
                }
              />

              {/* legacy: /club* -> /clubs/{clubId}* */}
              <Route
                path="/club"
                element={<ClubEntryRedirectPage to="home" />}
              />
              <Route
                path="/club/posts"
                element={<ClubEntryRedirectPage to="posts" />}
              />
              <Route path="/more" element={<MorePage />} />
              <Route
                path="/more/oauth-providers"
                element={<OAuthProvidersPage />}
              />
              <Route path="/more/my-clubs" element={<MyClubsPage />} />
              <Route path="/more/user-guide" element={<UserGuidePage />} />
              {/* Protected 페이지 (로그인 필수) */}
              <Route
                path="/schedules/club"
                element={
                  <ProtectedRoute>
                    <ScheduleListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedules/my"
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
