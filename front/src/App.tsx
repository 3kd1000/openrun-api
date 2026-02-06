import { Routes, Route, useLocation } from "react-router-dom";
import DrawGenerationPage from "./pages/draw/DrawGenerationPage";
import ScheduleListPage from "./pages/schedule/home/ScheduleListPage";
import MorePage from "./pages/more/MorePage";
import ScoreboardPage from "./pages/scoreboard/ScoreboardPage";
import LoginPage from "./pages/auth/LoginPage";
import SetupProfilePage from "./pages/auth/SetupProfilePage";
import ClubRecruitingPage from "./pages/club/recruit/ClubRecruitingPage";
import ClubMainPage from "./pages/club/home/ClubMainPage";
import ClubExplorePage from "./pages/club/list/ClubExplorePage";
import ClubMembersPage from "./pages/club/home/ClubMembersPage";
import ClubRulesPage from "./pages/club/home/ClubRulesPage";
import ClubManagePage from "./pages/club/manage/ClubManagePage";
import ClubCreatePage from "./pages/club/create/ClubCreatePage";
import ClubManageInfoPage from "./pages/club/manage/ClubManageInfoPage";
import ClubManagePolicyPage from "./pages/club/manage/ClubManagePolicyPage";
import ClubManageAwardPage from "./pages/club/manage/ClubManageAwardPage";
import ClubCreateOnboardingPage from "./pages/club/create/ClubCreateOnboardingPage";
import ClubNoticesManagePage from "./pages/club/manage/ClubNoticeManagePage";
import ClubEntryRedirectPage from "./pages/club/home/ClubEntryRedirectPage";
import GuestRecruitPage from "./pages/club/recruit/GuestRecruitPage";
import InterclubRecruitPage from "./pages/club/recruit/InterclubRecruitPage";
import ClubRecruitManagePage from "./pages/club/manage/ClubRecruitManagePage";
import ClubNoticeManagePage from "./pages/club/manage/ClubNoticeManagePage";
import ClubTransferOwnershipPage from "./pages/club/manage/ClubTransferOwnershipPage";
import ClubBallManagePage from "./pages/club/manage/ClubBallManagePage";
import TermsOfServicePage from "./pages/more/TermsOfServicePage";
import LicensePage from "./pages/more/LicensePage";
import OAuthProvidersPage from "./pages/more/OAuthProvidersPage";
import MyClubsPage from "./pages/more/MyClubsPage";
import UserGuidePage from "./pages/more/UserGuidePage";
import UserGuideDetailPage from "./pages/more/UserGuideDetailPage";
import GuideEditorPage from "./pages/more/GuideEditorPage";
import InquiryPage from "./pages/more/InquiryPage";
import NotificationPage from "./pages/notification/NotificationPage";
import IntroPage from "./pages/intro/IntroPage";
import Navigation from "./components/common/Navigation";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { usePWAUpdate } from "./hooks/usePWAUpdate";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AwardWinnersProvider } from "./contexts/AwardWinnersContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ClubLayout } from "./layouts/ClubLayout";
import "./App.css";

function App() {
  const location = useLocation();
  const { needRefresh, updateServiceWorker } = usePWAUpdate();

  // "/" 경로와 "/setup-profile", "/intro"에서는 Navigation 숨김
  const shouldShowNavigation =
    location.pathname !== "/" &&
    location.pathname !== "/setup-profile" &&
    location.pathname !== "/intro";

  return (
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
          <AwardWinnersProvider>
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
              <Route path="/intro" element={<IntroPage />} />
              <Route path="/more/terms" element={<TermsOfServicePage />} />
              <Route path="/more/license" element={<LicensePage />} />
              <Route path="/clubs/explore" element={<ClubExplorePage />} />
              <Route
                path="/clubs/new"
                element={
                  <ProtectedRoute>
                    <ClubCreatePage />
                  </ProtectedRoute>
                }
              />
              {/* Public: 클럽 모집 페이지(가입 신청 등) */}
              <Route
                path="/clubs/:clubId/recruiting"
                element={<ClubRecruitingPage />}
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
                path="/clubs/:clubId/manage/award"
                element={
                  <ProtectedRoute>
                    <ClubManageAwardPage />
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
                    <ClubRecruitManagePage />
                  </ProtectedRoute>
                }
              />
            
              <Route
                path="/clubs/:clubId/manage/content"
                element={
                  <ProtectedRoute>
                    <ClubNoticeManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/transfer-ownership"
                element={
                  <ProtectedRoute>
                    <ClubTransferOwnershipPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:clubId/manage/balls"
                element={
                  <ProtectedRoute>
                    <ClubBallManagePage />
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
                    <ClubLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ClubMainPage />} />
              </Route>

              {/* legacy: /club* -> /clubs/{clubId}* */}
              <Route
                path="/club"
                element={<ClubEntryRedirectPage />}
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/more" element={<MorePage />} />
              <Route
                path="/more/oauth-providers"
                element={<OAuthProvidersPage />}
              />
              <Route path="/more/my-clubs" element={<MyClubsPage />} />
              <Route
                path="/more/inquiry"
                element={
                  <ProtectedRoute>
                    <InquiryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/more/user-guide" element={<UserGuidePage />} />
              <Route path="/more/user-guide/:category" element={<UserGuideDetailPage />} />
              {/* 가이드 에디터: 개발 환경에서만 접근 가능 */}
              {import.meta.env.DEV && (
                <Route path="/more/guide-editor" element={<GuideEditorPage />} />
              )}
              {/* Protected 페이지 (로그인 필수) - ClubLayout 사용 */}
              <Route
                element={
                  <ProtectedRoute>
                    <ClubLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/schedules/club" element={<ScheduleListPage />} />
                <Route path="/schedules/my" element={<ScheduleListPage />} />
                <Route path="/scoreboard" element={<ScoreboardPage />} />
              </Route>
              <Route
                path="/setup-profile"
                element={
                  <ProtectedRoute>
                    <SetupProfilePage />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </div>
        </main>
        {/* 네비게이션 바가 있을 때는 Footer 숨김 (네비게이션 바에 통합) */}
        {!shouldShowNavigation && <Footer />}

        {/* PWA 주석 테스트*/}

        {/* PWA 업데이트 프롬프트 주석 */}
          {needRefresh && <PWAUpdatePrompt onUpdate={updateServiceWorker} />}
          </div>
          </AwardWinnersProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
