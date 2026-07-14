import { useMemo } from 'react';
import { getSocietes } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { KpiCard, EmptyState, ChartCanvas, Legend, statusBadge } from '../components/ui/index.js';

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value || 0));

export default function Societes() {
  const { data = [], loading, error, refresh } = useFetch(getSocietes, [], []);
  const total = data.length;
  const totalProspects = useMemo(() => data.reduce((sum, item) => sum + Number(item.prospects || 0), 0), [data]);
  const domaines = useMemo(() => {
    const map = {};
    data.forEach((item) => {
      map[item.domaine] = (map[item.domaine] || 0) + 1;
    });
    return map;
  }, [data]);
  const topDomaine = Object.entries(domaines).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return (
    <div>
      <div className="topbar-actions">
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="error-banner">Erreur de chargement : {error}</div>}
      {!data.length && loading && <EmptyState label="Chargement des sociétés…" />}

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
            data={{ labels: data.map((item) => item.nom), datasets: [{ data: data.map((item) => Number(item.prospects || 0)), backgroundColor: '#5b9df0', borderRadius: 4, maxBarThickness: 40 }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Répartition par domaine</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: Object.keys(domaines), datasets: [{ data: Object.values(domaines), backgroundColor: ['#5b9df0', '#9d8cff', '#e8a33d', '#34c787'], borderWidth: 2, borderColor: '#12161d' }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '72%' }}
          />
          <Legend items={Object.keys(domaines).map((label, index) => ({ label, color: ['#5b9df0', '#9d8cff', '#e8a33d', '#34c787'][index % 4] }))} />
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
              {data.map((societe) => (
                <tr key={societe.id}>
                  <td className="lead-name">{societe.nom}</td>
                  <td>{statusBadge(societe.domaine === 'Marketing Digital' ? 'Qualified' : 'EN_COURS')}</td>
                  <td className="lead-channel">{societe.adresse}</td>
                  <td className="lead-channel">{societe.admin}</td>
                  <td className="num">{societe.prospects || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && <EmptyState label="Aucune société enregistrée." />}
        </div>
      </section>
    </div>
  );
}
