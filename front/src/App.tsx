import { Routes, Route } from 'react-router-dom';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';
import AuthTestPage from './pages/AuthTestPage';
import DevAuthPage from './pages/DevAuthPage';
import ClubListPage from './pages/club/ClubListPage';
import ClubDetailPage from './pages/club/ClubDetailPage';
import ClubAdminPage from './pages/club/ClubAdminPage';
import Footer from './components/common/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <main className="App-content">
        <Routes>
          <Route path="/" element={<DrawGenerationPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} />
          <Route path="/dev/login" element={<DevAuthPage />} />
          <Route path="/clubs" element={<ClubListPage />} />
          <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
          <Route path="/clubs/:clubId/admin" element={<ClubAdminPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
