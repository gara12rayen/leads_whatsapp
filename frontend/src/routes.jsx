import Dashboard from './pages/Dashboard.jsx';
import Prospects from './pages/Prospects.jsx';
import Conversations from './pages/Conversations.jsx';
import Produits from './pages/Produits.jsx';
import Societes from './pages/Societes.jsx';

export const routes = [
  { path: '/', element: Dashboard },
  { path: '/prospects', element: Prospects },
  { path: '/conversations', element: Conversations },
  { path: '/produits', element: Produits },
  { path: '/societes', element: Societes },
];
