import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';
import DrawListPage from './pages/draw/DrawListPage';
import ScheduleListPage from './pages/schedule/ScheduleListPage';
import ScoreboardPage from './pages/scoreboard/ScoreboardPage';
import AuthTestPage from './pages/AuthTestPage';
import LoginPage from './pages/LoginPage';
import SetupProfilePage from './pages/SetupProfilePage';
import DevAuthPage from './pages/DevAuthPage';
import ClubListPage from './pages/club/ClubListPage';
import ClubDetailPage from './pages/club/ClubDetailPage';
import ClubAdminPage from './pages/club/ClubAdminPage';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import DevUserSwitcher from './components/DevUserSwitcher';
import { setupAuthListener } from './services/firebase';
import './App.css';

function App() {
  const location = useLocation();

  // Firebase 자동 로그인 및 토큰 갱신 설정
  useEffect(() => {
    console.log('🔧 Firebase 자동 토큰 갱신 리스너 설정');
    setupAuthListener((token) => {
      console.log('🔄 토큰 갱신됨 (App.tsx)');
    });
  }, []);

  // "/" 경로와 "/setup-profile"에서는 Navigation 숨김
  const shouldShowNavigation = location.pathname !== '/' && location.pathname !== '/setup-profile';

  return (
    <div className="App">
      {/* <DevUserSwitcher /> */}
      {shouldShowNavigation && <Navigation />}
      <main className="App-content">
        <div className="App-content-wrapper">
          <Routes>
            <Route path="/" element={<DrawGenerationPage />} />
            <Route path="/schedules" element={<ScheduleListPage />} />
            <Route path="/draws" element={<DrawListPage />} />
            <Route path="/scoreboard" element={<ScoreboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup-profile" element={<SetupProfilePage />} />
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
