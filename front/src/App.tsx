import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import ScheduleListPage from "./pages/schedule/home/ScheduleListPage";
import ScheduleCreatePage from "./pages/schedule/create/ScheduleCreatePage";
import ScheduleDetailPage from "./pages/schedule/detail/ScheduleDetailPage";
import MorePage from "./pages/more/MorePage";
import ScoreboardPage from "./pages/scoreboard/ScoreboardPage";
import LoginPage from "./pages/auth/LoginPage";
import SetupProfilePage from "./pages/auth/SetupProfilePage";
import ClubRecruitingPage from "./pages/club/recruit/ClubRecruitingPage";
import ClubMainPage from "./pages/club/home/ClubMainPage";
import ClubExplorePage from "./pages/club/list/ClubExplorePage";
import ClubMembersPage from "./pages/club/home/ClubMembersPage";
import MemberProfilePage from "./pages/club/home/MemberProfilePage";
import ClubRulesPage from "./pages/club/home/ClubRulesPage";
import ClubManagePage from "./pages/club/manage/ClubManagePage";
import ClubCreatePage from "./pages/club/create/ClubCreatePage";
import ClubManageInfoPage from "./pages/club/manage/ClubManageInfoPage";
import ClubManagePolicyPage from "./pages/club/manage/ClubManagePolicyPage";
import ClubManageAwardPage from "./pages/club/manage/ClubManageAwardPage";
import ClubCreateOnboardingPage from "./pages/club/create/ClubCreateOnboardingPage";
import ClubEntryRedirectPage from "./pages/club/home/ClubEntryRedirectPage";
import GuestRecruitPage from "./pages/club/recruit/GuestRecruitPage";
import InterclubRecruitPage from "./pages/club/recruit/InterclubRecruitPage";
import ScheduleRecruitPage from "./pages/schedule/recruit/ScheduleRecruitPage";
import ClubRecruitManagePage from "./pages/club/manage/ClubRecruitManagePage";
import ClubNoticeManagePage from "./pages/club/manage/ClubNoticeManagePage";
import ClubTransferOwnershipPage from "./pages/club/manage/ClubTransferOwnershipPage";
import ClubBallManagePage from "./pages/club/manage/ClubBallManagePage";
import TermsOfServicePage from "./pages/more/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import LicensePage from "./pages/more/LicensePage";
import OAuthProvidersPage from "./pages/more/OAuthProvidersPage";
import MyClubsPage from "./pages/more/MyClubsPage";
import UserGuidePage from "./pages/more/UserGuidePage";
import UserGuideDetailPage from "./pages/more/UserGuideDetailPage";
import GuideEditorPage from "./pages/more/GuideEditorPage";
import InquiryPage from "./pages/more/InquiryPage";
import ProfileEditPage from "./pages/more/ProfileEditPage";
import NotificationPage from "./pages/notification/NotificationPage";
import NotificationSettingsPage from "./pages/more/NotificationSettingsPage";
import CalendarSettingsPage from "./pages/more/CalendarSettingsPage";
import IntroPage from "./pages/intro/IntroPage";
import InstallGuidePage from "./pages/pwa/InstallGuidePage";
import MessageListPage from "./pages/message/MessageListPage";
import MessageDetailPage from "./pages/message/MessageDetailPage";
import Navigation from "./components/common/Navigation";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { PwaInstallProvider } from "./contexts/PwaInstallContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AwardWinnersProvider } from "./contexts/AwardWinnersContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { MessageProvider } from "./contexts/MessageContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ClubLayout } from "./layouts/ClubLayout";
import { QueryProvider } from "./providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import "./App.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // 라우트 전환 시 스크롤 최상단으로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 푸시 알림 클릭 시 Cache API에 저장된 pending URL을 정리하는 헬퍼
  const clearPendingNotificationCache = async () => {
    try {
      const cache = await caches.open("notification-pending");
      await cache.delete("/notification-pending-url");
    } catch { /* ignore */ }
  };

  // 푸시 알림 클릭 시 SW에서 postMessage로 전달한 URL로 네비게이션 (앱이 포그라운드일 때)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      console.log("[App] postMessage 수신:", JSON.stringify(event.data));
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data?.url) {
        console.log("[App] postMessage → navigate:", event.data.url);
        // postMessage로 처리 완료 → Cache API의 중복 항목 정리
        clearPendingNotificationCache();
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [navigate]);

  // 푸시 알림 클릭 시 Cache API에 저장된 pending URL 확인 (앱이 꺼져있거나 백그라운드일 때)
  useEffect(() => {
    const PENDING_URL_TTL = 30_000; // 30초 이내만 유효

    const checkPendingNotificationUrl = async () => {
      try {
        const cache = await caches.open("notification-pending");
        const response = await cache.match("/notification-pending-url");
        console.log("[App] Cache API 확인 - 항목 존재:", !!response);
        if (response) {
          const data = await response.json();
          await cache.delete("/notification-pending-url");
          const age = Date.now() - data.timestamp;
          console.log("[App] Cache 데이터:", JSON.stringify(data), "경과:", age, "ms");
          // 30초 이내 저장된 URL만 사용 (오래된 알림 무시)
          if (data?.url?.startsWith("/") && age < PENDING_URL_TTL) {
            console.log("[App] Cache API → navigate:", data.url);
            navigate(data.url);
          } else {
            console.log("[App] Cache 만료 또는 유효하지 않음 (TTL:", PENDING_URL_TTL, ")");
          }
        }
      } catch (e) {
        console.log("[App] Cache API 오류:", e);
      }
    };

    // 마운트 시 확인 (앱이 꺼져있다가 열린 경우)
    console.log("[App] 마운트 시 Cache API 확인");
    checkPendingNotificationUrl();

    // 화면 복귀 시 확인 (앱이 백그라운드였다가 포커스된 경우)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[App] visibilitychange → visible, Cache API 확인");
        checkPendingNotificationUrl();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [navigate]);

  // "/" 경로와 "/setup-profile", "/intro"에서는 Navigation 숨김
  const shouldShowNavigation =
    location.pathname !== "/" &&
    location.pathname !== "/login" &&
    location.pathname !== "/setup-profile" &&
    location.pathname !== "/intro" &&
    location.pathname !== "/install-guide";

  return (
    <QueryProvider>
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <PwaInstallProvider>
          <NotificationProvider>
          <MessageProvider>
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
              <Route path="/" element={<Navigate to="/intro" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/intro" element={<IntroPage />} />
              <Route path="/more/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/more/license" element={<LicensePage />} />
              <Route path="/explore" element={<ClubExplorePage />} />
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
                path="/clubs/:clubId/members/:userId"
                element={
                  <ProtectedRoute>
                    <MemberProfilePage />
                  </ProtectedRoute>
                }
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
                path="/clubs/:clubId/guest-recruit/:scheduleId"
                element={<GuestRecruitPage />}
              />
              <Route
                path="/clubs/:clubId/interclub-recruit/:scheduleId"
                element={<InterclubRecruitPage />}
              />
              {/* 통합 모집 페이지 (클럽/공개 공용) */}
              <Route
                path="/schedules/:scheduleId/recruit"
                element={<ScheduleRecruitPage />}
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
              <Route path="/install-guide" element={<InstallGuidePage />} />
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
              <Route
                path="/more/profile/edit"
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/more/notification-settings"
                element={
                  <ProtectedRoute>
                    <NotificationSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/more/calendar-settings"
                element={
                  <ProtectedRoute>
                    <CalendarSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/more/user-guide" element={<UserGuidePage />} />
              <Route path="/more/user-guide/:category" element={<UserGuideDetailPage />} />
              {/* 가이드 에디터: 개발 환경에서만 접근 가능 */}
              {import.meta.env.DEV && (
                <Route path="/more/guide-editor" element={<GuideEditorPage />} />
              )}
              {/* 메시지 (DM) */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessageListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:partnerId"
                element={
                  <ProtectedRoute>
                    <MessageDetailPage />
                  </ProtectedRoute>
                }
              />
              {/* 공개일정 생성 (클럽 불필요, ProtectedRoute) */}
              <Route
                path="/schedules/public/new"
                element={
                  <ProtectedRoute>
                    <ScheduleCreatePage />
                  </ProtectedRoute>
                }
              />
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
                <Route path="/schedules/new" element={<ScheduleCreatePage />} />
                <Route path="/schedules/:scheduleId" element={<ScheduleDetailPage />} />
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

          </div>
          <Toaster position="top-center" richColors />
          </AwardWinnersProvider>
          </MessageProvider>
          </NotificationProvider>
          </PwaInstallProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
    </QueryProvider>
  );
}

export default App;
