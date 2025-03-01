import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Browser from './components/Browser';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Browser />} />
      </Routes>
    </Router>
  );
}
