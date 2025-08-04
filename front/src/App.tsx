import { Routes, Route } from 'react-router-dom';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DrawGenerationPage />} />
    </Routes>
  );
}

export default App;
