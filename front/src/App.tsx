import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import DrawGenerationPage from './pages/draw/DrawGenerationPage';

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/draw">Draw Generation</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/draw" element={<DrawGenerationPage />} />
      </Routes>
    </div>
  );
}

export default App;
