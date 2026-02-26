import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AuditLogPage from "./pages/AuditLogPage";
import AwardWinnerPage from "./pages/AwardWinnerPage";
import BatchPage from "./pages/BatchPage";
import InquiryManagePage from "./pages/InquiryManagePage";
import PushSendPage from "./pages/PushSendPage";
import NotificationHistoryPage from "./pages/NotificationHistoryPage";
import DmPage from "./pages/DmPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 로그인 페이지 (인증 불필요) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 보호된 라우트 (인증 필요) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="audit-logs" element={<AuditLogPage />} />
          <Route path="award-winners" element={<AwardWinnerPage />} />
          <Route path="batch" element={<BatchPage />} />
          <Route path="inquiries" element={<InquiryManagePage />} />
          <Route path="push-send" element={<PushSendPage />} />
          <Route path="notification-history" element={<NotificationHistoryPage />} />
          <Route path="dm" element={<DmPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
