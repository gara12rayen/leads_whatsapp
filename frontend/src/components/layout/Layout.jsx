import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

const ROUTE_META = {
  '/': { title: 'Tableau de bord', sub: 'Suivi en direct des prospects, conversations et messages WhatsApp.' },
  '/prospects': { title: 'Prospects', sub: 'Tous les contacts captés, par société et statut de qualification.' },
  '/conversations': { title: 'Conversations', sub: "Échanges WhatsApp en cours, chauds et fermés." },
  '/produits': { title: 'Produits', sub: 'Catalogue, stock et valeur par société.' },
  '/societes': { title: 'Sociétés', sub: 'Comptes clients rattachés à la plateforme.' },
};

export default function Layout() {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || ROUTE_META['/'];

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Navbar title={meta.title} sub={meta.sub} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
