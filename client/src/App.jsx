import { Routes, Route } from 'react-router-dom';
import BirthdayGate from './pages/BirthdayGate.jsx';
import WikiPage from './pages/WikiPage.jsx';
import Gallery from './pages/Gallery.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BirthdayGate />} />
      <Route path="/wiki" element={<WikiPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<BirthdayGate />} />
    </Routes>
  );
}
