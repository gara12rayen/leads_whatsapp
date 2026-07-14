import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Tableau de bord' },
  { path: '/prospects', label: 'Prospects' },
  { path: '/conversations', label: 'Conversations' },
  { path: '/produits', label: 'Produits' },
  { path: '/societes', label: 'Sociétés' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">LW</div>
        <div className="brand-text">
          <strong>Leads WhatsApp</strong>
          <span>Ma Société</span>
        </div>
      </div>

      <nav className="nav-group">
        <div className="nav-label">Pilotage</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            end={item.path === '/'}
          >
            <span className="dot" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        Connecté à MySQL<br />
        leads_whatsapp
      </div>
    </aside>
  );
}
