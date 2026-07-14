const { useEffect, useMemo, useRef, useState, useCallback } = React;

const numberFormatter = new Intl.NumberFormat('fr-FR');
const currencyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const formatNumber = (value) => numberFormatter.format(Number(value || 0));
const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const ENDPOINTS = {
  dashboard: '/api/dashboard/summary',
  prospects: '/api/dashboard/prospects',
  conversations: '/api/dashboard/conversations',
  produits: '/api/dashboard/produits',
  societes: '/api/dashboard/societes',
};

async function loadSection(key) {
  try {
    const response = await fetch(ENDPOINTS[key]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

/* ================= shared bits ================= */

const STATUS_MAP = {
  Converted: { className: 'badge green', label: 'Converti' },
  Qualified: { className: 'badge green', label: 'Qualifié' },
  Hot: { className: 'badge green', label: 'Chaud' },
  Pending: { className: 'badge orange', label: 'En attente' },
  Closed: { className: 'badge orange', label: 'Fermé' },
  Lost: { className: 'badge orange', label: 'Perdu' },
  EN_COURS: { className: 'badge blue', label: 'En cours' },
  FERMEE: { className: 'badge orange', label: 'Fermée' },
  CHAUDE: { className: 'badge green', label: 'Chaude' },
};

function statusBadge(status) {
  const match = STATUS_MAP[status] || { className: 'badge blue', label: status || '—' };
  return (
    <span className={match.className}>
      <span className="dot" />
      {match.label}
    </span>
  );
}

function Sparkline({ points, color = '#34c787' }) {
  const width = 96;
  const height = 32;

  const path = useMemo(() => {
    const values = points && points.length ? points : [0, 0];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / Math.max(values.length - 1, 1);

    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / range) * (height - 6) - 3;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ label, value, delta, trend, sparkColor }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
        {trend && <Sparkline points={trend} color={sparkColor} />}
      </div>
      {delta && <div className="kpi-delta">{delta}</div>}
    </div>
  );
}

const CHART_FONT = { family: 'Inter, sans-serif', size: 11 };
const GRID_COLOR = 'rgba(139, 147, 164, 0.10)';
const TICK_COLOR = '#8b93a4';
const TOOLTIP_STYLE = {
  backgroundColor: '#171c24',
  borderColor: '#232a35',
  borderWidth: 1,
  titleColor: '#e9ebef',
  bodyColor: '#8b93a4',
  titleFont: CHART_FONT,
  bodyFont: CHART_FONT,
  padding: 10,
  displayColors: false,
};

function ChartCanvas({ type, data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const signature = JSON.stringify({ type, data, options });

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, { type, data, options });
    return () => chartRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="chart-box">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

function lineOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { display: false }, tooltip: TOOLTIP_STYLE },
    scales: {
      x: { grid: { display: false }, ticks: { color: TICK_COLOR, font: CHART_FONT }, border: { color: '#232a35' } },
      y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: CHART_FONT }, border: { display: false }, beginAtZero: true },
    },
    ...extra,
  };
}

function barOptions(extra = {}) {
  return lineOptions(extra);
}

function doughnutOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: TOOLTIP_STYLE },
    cutout: '72%',
  };
}

function Legend({ items }) {
  return (
    <div className="legend-row">
      {items.map((item) => (
        <span className="item" key={item.label}>
          <span className="swatch" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="empty-state">{label}</div>;
}

/* ================= views ================= */

function DashboardView({ data }) {
  const leadTrend = useMemo(() => (data.leadFlow?.length ? data.leadFlow.map((i) => i.value) : [0, 0]), [data]);
  const dropoffRate = data.kpis.totalProspects
    ? Math.round((data.kpis.unqualifiedProspects / data.kpis.totalProspects) * 100)
    : 0;

  const kpis = [
    { label: 'Prospects totaux', value: formatNumber(data.kpis.totalProspects), delta: `${formatNumber(data.kpis.qualifiedProspects)} qualifiés`, sparkColor: '#5b9df0' },
    { label: 'Messages envoyés', value: formatNumber(data.kpis.totalMessages), delta: `${formatNumber(data.kpis.totalConversations)} conversations`, sparkColor: '#9d8cff' },
    { label: 'Réponses reçues', value: formatNumber(data.kpis.totalInteractions), delta: `Score moyen ${data.kpis.averageInteractionScore}`, sparkColor: '#34c787' },
    { label: 'Taux de déperdition', value: `${dropoffRate}%`, delta: `${formatNumber(data.kpis.unqualifiedProspects)} non qualifiés`, sparkColor: '#e8a33d' },
  ];

  const leadLabels = data.leadFlow?.length ? data.leadFlow.map((i) => i.label) : ['Aucune donnée'];
  const leadValues = data.leadFlow?.length ? data.leadFlow.map((i) => i.value) : [0];

  const conversationValues = [data.conversationSplit.open, data.conversationSplit.closed, data.conversationSplit.hot, data.conversationSplit.qualified];
  const conversationColors = ['#5b9df0', '#576073', '#e8a33d', '#34c787'];

  const velocityLabels = data.velocity?.length ? data.velocity.map((i) => i.label) : ['Aucune donnée'];
  const velocityValues = data.velocity?.length ? data.velocity.map((i) => i.value) : [0];

  return (
    <React.Fragment>
      <section className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} trend={leadTrend} />
        ))}
      </section>

      <section className="charts-row">
        <div className="panel">
          <div className="panel-head">
            <h2>Flux de prospects</h2>
            <span className="hint">7 derniers jours</span>
          </div>
          <ChartCanvas
            type="line"
            data={{
              labels: leadLabels,
              datasets: [{
                label: 'Nouveaux prospects', data: leadValues, borderColor: '#5b9df0',
                backgroundColor: 'rgba(91, 157, 240, 0.06)', borderWidth: 1.75, tension: 0.3,
                fill: true, pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: '#5b9df0',
              }],
            }}
            options={lineOptions()}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Répartition des conversations</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: ['Ouvertes', 'Fermées', 'Chaudes', 'Qualifiées'], datasets: [{ data: conversationValues, backgroundColor: conversationColors, borderWidth: 2, borderColor: '#12161d' }] }}
            options={doughnutOptions()}
          />
          <Legend items={[
            { label: 'Ouvertes', color: '#5b9df0' }, { label: 'Fermées', color: '#576073' },
            { label: 'Chaudes', color: '#e8a33d' }, { label: 'Qualifiées', color: '#34c787' },
          ]} />
        </div>
      </section>

      <section className="bottom-row">
        <div className="panel">
          <div className="panel-head">
            <h2>Pipeline récent</h2>
            <span className="hint">{data.recentProspects?.length || 0} entrées</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Prospect</th><th>Statut</th><th>Canal</th><th>Messages</th><th>Score</th></tr>
              </thead>
              <tbody>
                {(data.recentProspects || []).map((lead) => (
                  <tr key={lead.id}>
                    <td className="lead-name">{lead.name}</td>
                    <td>{statusBadge(lead.status)}</td>
                    <td className="lead-channel">{lead.conversationStatus}</td>
                    <td className="num">{lead.messageCount}</td>
                    <td className="num">{lead.averageScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.recentProspects || []).length === 0 && <EmptyState label="Aucun prospect pour le moment." />}
          </div>
          <div className="footer-note">Données issues de MySQL via <code>/api/dashboard/summary</code>.</div>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Vélocité de réponse</h2></div>
          <ChartCanvas
            type="bar"
            data={{ labels: velocityLabels, datasets: [{ label: 'Réponses', data: velocityValues, borderRadius: 4, maxBarThickness: 34, backgroundColor: '#34c787' }] }}
            options={barOptions()}
          />
        </div>
      </section>
    </React.Fragment>
  );
}

function ProspectsView({ data }) {
  const total = data.length;
  const qualified = data.filter((p) => p.statut === 1).length;
  const unqualified = total - qualified;
  const rate = total ? Math.round((qualified / total) * 100) : 0;

  const bySociete = useMemo(() => {
    const map = {};
    data.forEach((p) => { map[p.societe] = (map[p.societe] || 0) + 1; });
    return map;
  }, [data]);

  return (
    <React.Fragment>
      <section className="kpi-grid">
        <KpiCard label="Prospects totaux" value={formatNumber(total)} delta="toutes sociétés" />
        <KpiCard label="Qualifiés" value={formatNumber(qualified)} delta={`${rate}% du total`} />
        <KpiCard label="Non qualifiés" value={formatNumber(unqualified)} delta="à relancer" />
        <KpiCard label="Taux de qualification" value={`${rate}%`} delta="objectif 50%" />
      </section>

      <section className="charts-row">
        <div className="panel">
          <div className="panel-head"><h2>Prospects par société</h2></div>
          <ChartCanvas
            type="bar"
            data={{
              labels: Object.keys(bySociete),
              datasets: [{ data: Object.values(bySociete), backgroundColor: '#5b9df0', borderRadius: 4, maxBarThickness: 40 }],
            }}
            options={barOptions()}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Qualifiés vs non qualifiés</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: ['Qualifiés', 'Non qualifiés'], datasets: [{ data: [qualified, unqualified], backgroundColor: ['#34c787', '#576073'], borderWidth: 2, borderColor: '#12161d' }] }}
            options={doughnutOptions()}
          />
          <Legend items={[{ label: 'Qualifiés', color: '#34c787' }, { label: 'Non qualifiés', color: '#576073' }]} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Tous les prospects</h2>
          <span className="hint">{total} entrées</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nom</th><th>Téléphone</th><th>Email</th><th>Société</th><th>Statut</th><th>Créé le</th></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="lead-name">{p.nom}</td>
                  <td className="num">{p.telephone}</td>
                  <td className="lead-channel">{p.email || '—'}</td>
                  <td className="lead-channel">{p.societe}</td>
                  <td>{statusBadge(p.statut === 1 ? 'Qualified' : 'Pending')}</td>
                  <td className="num">{p.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState label="Aucun prospect enregistré." />}
        </div>
      </section>
    </React.Fragment>
  );
}

function ConversationsView({ data }) {
  const total = data.length;
  const open = data.filter((c) => c.statut === 'EN_COURS').length;
  const closed = data.filter((c) => c.statut === 'FERMEE').length;
  const hot = data.filter((c) => c.statut === 'CHAUDE').length;
  const avgScore = total ? Math.round((data.reduce((sum, c) => sum + c.score, 0) / total) * 10) / 10 : 0;

  return (
    <React.Fragment>
      <section className="kpi-grid">
        <KpiCard label="Conversations totales" value={formatNumber(total)} delta="toutes sociétés" />
        <KpiCard label="En cours" value={formatNumber(open)} delta="à traiter" />
        <KpiCard label="Chaudes" value={formatNumber(hot)} delta="priorité haute" />
        <KpiCard label="Score moyen" value={avgScore} delta="sur 100" />
      </section>

      <section className="charts-row">
        <div className="panel">
          <div className="panel-head"><h2>Messages par conversation</h2></div>
          <ChartCanvas
            type="bar"
            data={{
              labels: data.map((c) => c.prospect),
              datasets: [{ data: data.map((c) => c.messages), backgroundColor: '#9d8cff', borderRadius: 4, maxBarThickness: 34 }],
            }}
            options={barOptions()}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Répartition par statut</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: ['En cours', 'Fermées', 'Chaudes'], datasets: [{ data: [open, closed, hot], backgroundColor: ['#5b9df0', '#576073', '#e8a33d'], borderWidth: 2, borderColor: '#12161d' }] }}
            options={doughnutOptions()}
          />
          <Legend items={[{ label: 'En cours', color: '#5b9df0' }, { label: 'Fermées', color: '#576073' }, { label: 'Chaudes', color: '#e8a33d' }]} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Toutes les conversations</h2>
          <span className="hint">{total} entrées</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Prospect</th><th>Statut</th><th>Date de début</th><th>Messages</th><th>Score</th></tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="lead-name">{c.prospect}</td>
                  <td>{statusBadge(c.statut)}</td>
                  <td className="num">{c.dateDebut}</td>
                  <td className="num">{c.messages}</td>
                  <td className="num">{c.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState label="Aucune conversation enregistrée." />}
        </div>
      </section>
    </React.Fragment>
  );
}

function ProduitsView({ data }) {
  const total = data.length;
  const totalStock = data.reduce((sum, p) => sum + p.quantite, 0);
  const totalValue = data.reduce((sum, p) => sum + p.quantite * p.prix, 0);
  const avgPrice = total ? Math.round(data.reduce((sum, p) => sum + p.prix, 0) / total) : 0;

  return (
    <React.Fragment>
      <section className="kpi-grid">
        <KpiCard label="Produits actifs" value={formatNumber(total)} delta="toutes sociétés" />
        <KpiCard label="Unités en stock" value={formatNumber(totalStock)} delta="toutes références" />
        <KpiCard label="Valeur du stock" value={formatCurrency(totalValue)} delta="quantité × prix" />
        <KpiCard label="Prix moyen" value={formatCurrency(avgPrice)} delta="par produit" />
      </section>

      <section className="charts-row">
        <div className="panel">
          <div className="panel-head"><h2>Valeur de stock par produit</h2></div>
          <ChartCanvas
            type="bar"
            data={{
              labels: data.map((p) => p.nom),
              datasets: [{ data: data.map((p) => p.quantite * p.prix), backgroundColor: '#34c787', borderRadius: 4, maxBarThickness: 34 }],
            }}
            options={barOptions()}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Stock par société</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{
              labels: [...new Set(data.map((p) => p.societe))],
              datasets: [{
                data: [...new Set(data.map((p) => p.societe))].map((s) => data.filter((p) => p.societe === s).reduce((sum, p) => sum + p.quantite, 0)),
                backgroundColor: ['#5b9df0', '#9d8cff', '#e8a33d', '#34c787'],
                borderWidth: 2, borderColor: '#12161d',
              }],
            }}
            options={doughnutOptions()}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Tous les produits</h2>
          <span className="hint">{total} entrées</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nom</th><th>Société</th><th>Quantité</th><th>Prix</th><th>Valeur stock</th><th>Fiche PDF</th></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="lead-name">{p.nom}</td>
                  <td className="lead-channel">{p.societe}</td>
                  <td className="num">{p.quantite}</td>
                  <td className="num">{formatCurrency(p.prix)}</td>
                  <td className="num">{formatCurrency(p.quantite * p.prix)}</td>
                  <td>{p.fichierPDF ? <span className="badge blue"><span className="dot" />PDF</span> : <span className="lead-channel">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState label="Aucun produit enregistré." />}
        </div>
      </section>
    </React.Fragment>
  );
}

function SocietesView({ data }) {
  const total = data.length;
  const totalProspects = data.reduce((sum, s) => sum + (s.prospects || 0), 0);
  const domaines = useMemo(() => {
    const map = {};
    data.forEach((s) => { map[s.domaine] = (map[s.domaine] || 0) + 1; });
    return map;
  }, [data]);
  const topDomaine = Object.entries(domaines).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return (
    <React.Fragment>
      <section className="kpi-grid">
        <KpiCard label="Sociétés actives" value={formatNumber(total)} delta="sur la plateforme" />
        <KpiCard label="Prospects cumulés" value={formatNumber(totalProspects)} delta="toutes sociétés" />
        <KpiCard label="Domaine principal" value={topDomaine} delta="le plus représenté" />
        <KpiCard label="Moy. prospects / société" value={total ? Math.round(totalProspects / total) : 0} delta="par société" />
      </section>

      <section className="charts-row">
        <div className="panel">
          <div className="panel-head"><h2>Prospects par société</h2></div>
          <ChartCanvas
            type="bar"
            data={{ labels: data.map((s) => s.nom), datasets: [{ data: data.map((s) => s.prospects || 0), backgroundColor: '#5b9df0', borderRadius: 4, maxBarThickness: 40 }] }}
            options={barOptions()}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Répartition par domaine</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: Object.keys(domaines), datasets: [{ data: Object.values(domaines), backgroundColor: ['#5b9df0', '#9d8cff', '#e8a33d', '#34c787'], borderWidth: 2, borderColor: '#12161d' }] }}
            options={doughnutOptions()}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Toutes les sociétés</h2>
          <span className="hint">{total} entrées</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Société</th><th>Domaine</th><th>Adresse</th><th>Admin</th><th>Prospects</th></tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="lead-name">{s.nom}</td>
                  <td>{statusBadge(s.domaine === 'Marketing Digital' ? 'Qualified' : 'EN_COURS')}</td>
                  <td className="lead-channel">{s.adresse}</td>
                  <td className="lead-channel">{s.admin}</td>
                  <td className="num">{s.prospects || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState label="Aucune société enregistrée." />}
        </div>
      </section>
    </React.Fragment>
  );
}

/* ================= app shell ================= */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'prospects', label: 'Prospects' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'produits', label: 'Produits' },
  { key: 'societes', label: 'Sociétés' },
];

const TITLES = {
  dashboard: { title: 'Tableau de bord', sub: 'Suivi en direct des prospects, conversations et messages WhatsApp.' },
  prospects: { title: 'Prospects', sub: 'Tous les contacts captés, par société et statut de qualification.' },
  conversations: { title: 'Conversations', sub: "Échanges WhatsApp en cours, chauds et fermés." },
  produits: { title: 'Produits', sub: 'Catalogue, stock et valeur par société.' },
  societes: { title: 'Sociétés', sub: 'Comptes clients rattachés à la plateforme.' },
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTab = useCallback((key) => {
    setLoading(true);
    setError('');
    loadSection(key).then((data) => {
      setCache((prev) => ({ ...prev, [key]: data }));
      setLastUpdated(new Date());
      setLoading(false);
    }).catch((fetchError) => {
      setError(fetchError.message || 'Erreur de chargement');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!cache[activeTab]) {
      fetchTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const refresh = () => fetchTab(activeTab);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const meta = TITLES[activeTab];
  const tabData = cache[activeTab];

  return (
    <div className="app">
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
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="dot" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          Connecté à MySQL<br />
          leads_whatsapp
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <p className={`sub${error ? ' error' : ''}`}>
                {error ? `Erreur de chargement : ${error}` : meta.sub}
            </p>
          </div>
          <div className="topbar-actions">
            <span className="pill">
              <span className="live-dot" />
              Mis à jour à {lastUpdatedLabel}
            </span>
            <button className="btn-refresh" onClick={refresh} disabled={loading}>
              {loading ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
        </div>

        {!tabData && loading && <EmptyState label="Chargement des données…" />}

        {tabData && activeTab === 'dashboard' && <DashboardView data={tabData} />}
        {tabData && activeTab === 'prospects' && <ProspectsView data={tabData} />}
        {tabData && activeTab === 'conversations' && <ConversationsView data={tabData} />}
        {tabData && activeTab === 'produits' && <ProduitsView data={tabData} />}
        {tabData && activeTab === 'societes' && <SocietesView data={tabData} />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
