import { Routes, Route } from 'react-router-dom';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';
import Footer from './components/common/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <main className="App-content">
        <Routes>
          <Route path="/" element={<DrawGenerationPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
