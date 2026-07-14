import { useMemo } from 'react';
import { getConversations } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { statusBadge, KpiCard, ChartCanvas, EmptyState, Legend } from '../components/ui/index.js';

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value || 0));

export default function Conversations() {
  const { data = [], loading, error, refresh } = useFetch(getConversations, [], []);
  const total = data.length;
  const open = useMemo(() => data.filter((item) => item.statut === 'EN_COURS').length, [data]);
  const closed = useMemo(() => data.filter((item) => item.statut === 'FERMEE').length, [data]);
  const hot = useMemo(() => data.filter((item) => item.statut === 'CHAUDE').length, [data]);
  const avgScore = total ? Math.round((data.reduce((sum, item) => sum + Number(item.score || 0), 0) / total) * 10) / 10 : 0;

  return (
    <div>
      <div className="topbar-actions">
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="error-banner">Erreur de chargement : {error}</div>}
      {!data.length && loading && <EmptyState label="Chargement des conversations…" />}

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
            data={{ labels: data.map((item) => item.prospect), datasets: [{ data: data.map((item) => item.messages), backgroundColor: '#9d8cff', borderRadius: 4, maxBarThickness: 34 }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Répartition par statut</h2></div>
          <ChartCanvas
            type="doughnut"
            data={{ labels: ['En cours', 'Fermées', 'Chaudes'], datasets: [{ data: [open, closed, hot], backgroundColor: ['#5b9df0', '#576073', '#e8a33d'], borderWidth: 2, borderColor: '#12161d' }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '72%' }}
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
              {data.map((conv) => (
                <tr key={conv.id}>
                  <td className="lead-name">{conv.prospect}</td>
                  <td>{statusBadge(conv.statut)}</td>
                  <td className="num">{conv.dateDebut}</td>
                  <td className="num">{conv.messages}</td>
                  <td className="num">{conv.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && <EmptyState label="Aucune conversation enregistrée." />}
        </div>
      </section>
    </div>
  );
}
