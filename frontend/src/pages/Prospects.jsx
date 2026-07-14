import { useMemo } from 'react';
import { getProspects } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { statusBadge, KpiCard, EmptyState } from '../components/ui/index.js';

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value || 0));

export default function Prospects() {
  const { data = [], loading, error, refresh } = useFetch(getProspects, [], []);
  const total = data.length;
  const qualified = useMemo(() => data.filter((item) => item.statut === 1).length, [data]);
  const unqualified = total - qualified;
  const rate = total ? Math.round((qualified / total) * 100) : 0;

  return (
    <div>
      <div className="topbar-actions">
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="error-banner">Erreur de chargement : {error}</div>}
      {!data.length && loading && <EmptyState label="Chargement des prospects…" />}

      <section className="kpi-grid">
        <KpiCard label="Prospects totaux" value={formatNumber(total)} delta="toutes sociétés" />
        <KpiCard label="Qualifiés" value={formatNumber(qualified)} delta={`${rate}% du total`} />
        <KpiCard label="Non qualifiés" value={formatNumber(unqualified)} delta="à relancer" />
        <KpiCard label="Taux de qualification" value={`${rate}%`} delta="objectif 50%" />
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
              {data.map((prospect) => (
                <tr key={prospect.id}>
                  <td className="lead-name">{prospect.nom}</td>
                  <td className="num">{prospect.telephone}</td>
                  <td className="lead-channel">{prospect.email || '—'}</td>
                  <td className="lead-channel">{prospect.societe}</td>
                  <td>{statusBadge(prospect.statut === 1 ? 'Qualified' : 'Pending')}</td>
                  <td className="num">{prospect.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && <EmptyState label="Aucun prospect enregistré." />}
        </div>
      </section>
    </div>
  );
}
