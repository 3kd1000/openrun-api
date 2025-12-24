import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import DrawGenerationPage from "./pages/draw/DrawGenerationPage";
import DrawListPage from "./pages/draw/DrawListPage";
import ScheduleListPage from "./pages/schedule/ScheduleListPage";
import ScoreboardPage from "./pages/scoreboard/ScoreboardPage";
import AuthTestPage from "./pages/AuthTestPage";
import DevAuthPage from "./pages/DevAuthPage";
import ClubListPage from "./pages/club/ClubListPage";
import ClubDetailPage from "./pages/club/ClubDetailPage";
import ClubAdminPage from "./pages/club/ClubAdminPage";
import Navigation from "./components/common/Navigation";
import Footer from "./components/common/Footer";
import DevUserSwitcher from "./components/DevUserSwitcher";
import "./App.css";

function App() {
  const location = useLocation();

  // Dev 환경에서만 user_id를 1로 고정 (클럽 공개용)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "";
    if (apiUrl.includes("dev-api")) {
      localStorage.setItem("devUserId", "1");
      console.log("🔧 Dev 환경: user_id를 1로 고정");
    }
  }, []);

  // "/" 경로에서는 Navigation 숨김 (일반 사용자용)
  const shouldShowNavigation = location.pathname !== "/";

  return (
    <div className="App">
      <DevUserSwitcher />
      {shouldShowNavigation && <Navigation />}
      <main className="App-content">
        <div className="App-content-wrapper">
          <Routes>
            <Route path="/" element={<DrawGenerationPage />} />
            <Route path="/schedules" element={<ScheduleListPage />} />
            <Route path="/draws" element={<DrawListPage />} />
            <Route path="/scoreboard" element={<ScoreboardPage />} />
            <Route path="/auth-test" element={<AuthTestPage />} />
            <Route path="/dev/login" element={<DevAuthPage />} />
            <Route path="/clubs" element={<ClubListPage />} />
            <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
            <Route path="/clubs/:clubId/admin" element={<ClubAdminPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
