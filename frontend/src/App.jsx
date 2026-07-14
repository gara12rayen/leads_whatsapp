import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Prospects from './pages/Prospects.jsx';
import Conversations from './pages/Conversations.jsx';
import Produits from './pages/Produits.jsx';
import Societes from './pages/Societes.jsx';
import './styles/dashboard.css';
import './styles/table.css';
import './styles/charts.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="prospects" element={<Prospects />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="produits" element={<Produits />} />
          <Route path="societes" element={<Societes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
