import { Routes, Route } from 'react-router-dom';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';
import AuthTestPage from './pages/AuthTestPage'; // 추가
import Footer from './components/common/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <main className="App-content">
        <Routes>
          <Route path="/" element={<DrawGenerationPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} /> {/* 추가 */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
