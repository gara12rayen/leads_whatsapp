import { useMemo } from 'react';
import { getDashboard } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { statusBadge, ChartCanvas, KpiCard, EmptyState, Legend } from '../components/ui/DashboardParts.jsx';

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value || 0));

export default function Dashboard() {
  const { data, loading, error, refresh } = useFetch(getDashboard);

  const leadTrend = useMemo(() => (data?.leadFlow?.length ? data.leadFlow.map((item) => item.value) : [0, 0]), [data]);
  const leadLabels = useMemo(() => (data?.leadFlow?.length ? data.leadFlow.map((item) => item.label) : ['Aucune donnée']), [data]);
  const leadValues = useMemo(() => (data?.leadFlow?.length ? data.leadFlow.map((item) => item.value) : [0]), [data]);
  const conversationValues = [data?.conversationSplit.open || 0, data?.conversationSplit.closed || 0, data?.conversationSplit.hot || 0, data?.conversationSplit.qualified || 0];
  const velocityLabels = useMemo(() => (data?.velocity?.length ? data.velocity.map((item) => item.label) : ['Aucune donnée']), [data]);
  const velocityValues = useMemo(() => (data?.velocity?.length ? data.velocity.map((item) => item.value) : [0]), [data]);

  const kpis = useMemo(() => {
    const totalProspects = data?.kpis.totalProspects || 0;
    const unqualifiedProspects = data?.kpis.unqualifiedProspects || 0;
    const dropoffRate = totalProspects ? Math.round((unqualifiedProspects / totalProspects) * 100) : 0;

    return [
      { label: 'Prospects totaux', value: formatNumber(data?.kpis.totalProspects), delta: `${formatNumber(data?.kpis.qualifiedProspects)} qualifiés`, sparkColor: '#5b9df0' },
      { label: 'Messages envoyés', value: formatNumber(data?.kpis.totalMessages), delta: `${formatNumber(data?.kpis.totalConversations)} conversations`, sparkColor: '#9d8cff' },
      { label: 'Réponses reçues', value: formatNumber(data?.kpis.totalInteractions), delta: `Score moyen ${data?.kpis.averageInteractionScore}`, sparkColor: '#34c787' },
      { label: 'Taux de déperdition', value: `${dropoffRate}%`, delta: `${formatNumber(unqualifiedProspects)} non qualifiés`, sparkColor: '#e8a33d' },
    ];
  }, [data]);

  return (
    <div>
      <div className="topbar-actions">
        <span className="pill">
          <span className="live-dot" />
          Mis à jour {loading ? '…' : 'à l’instant'}
        </span>
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="error-banner">Erreur de chargement : {error}</div>}
      {!data && loading && <EmptyState label="Chargement des données…" />}
      {data && (
        <>
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
                data={{ labels: leadLabels, datasets: [{ label: 'Nouveaux prospects', data: leadValues, borderColor: '#5b9df0', backgroundColor: 'rgba(91, 157, 240, 0.06)', borderWidth: 1.75, tension: 0.3, fill: true, pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: '#5b9df0' }] }}
                options={{ responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }}
              />
            </div>
            <div className="panel">
              <div className="panel-head">
                <h2>Répartition des conversations</h2>
              </div>
              <ChartCanvas
                type="doughnut"
                data={{ labels: ['Ouvertes', 'Fermées', 'Chaudes', 'Qualifiées'], datasets: [{ data: conversationValues, backgroundColor: ['#5b9df0', '#576073', '#e8a33d', '#34c787'], borderWidth: 2, borderColor: '#12161d' }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '72%' }}
              />
              <Legend items={[{ label: 'Ouvertes', color: '#5b9df0' }, { label: 'Fermées', color: '#576073' }, { label: 'Chaudes', color: '#e8a33d' }, { label: 'Qualifiées', color: '#34c787' }]} />
            </div>
          </section>

          <section className="bottom-row">
            <div className="panel">
              <div className="panel-head">
                <h2>Pipeline récent</h2>
                <span className="hint">{data.recentProspects.length} entrées</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Prospect</th><th>Statut</th><th>Canal</th><th>Messages</th><th>Score</th></tr>
                  </thead>
                  <tbody>
                    {data.recentProspects.map((lead) => (
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
                {data.recentProspects.length === 0 && <EmptyState label="Aucun prospect pour le moment." />}
              </div>
              <div className="footer-note">Données issues de MySQL via <code>/api/dashboard/summary</code>.</div>
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Vélocité de réponse</h2></div>
              <ChartCanvas
                type="bar"
                data={{ labels: velocityLabels, datasets: [{ label: 'Réponses', data: velocityValues, borderRadius: 4, maxBarThickness: 34, backgroundColor: '#34c787' }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
