import React, { useMemo } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
  New: { className: 'badge blue', label: 'Nouveau' },
};

export function statusBadge(status) {
  const match = STATUS_MAP[status] || { className: 'badge blue', label: status || '—' };
  return (
    <span className={match.className}>
      <span className="dot" />
      {match.label}
    </span>
  );
}

export function Sparkline({ points, color = '#34c787' }) {
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

export function KpiCard({ label, value, delta, trend, sparkColor }) {
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

export function ChartCanvas({ type, data, options }) {
  const canvasRef = React.useRef(null);
  const chartRef = React.useRef(null);
  const signature = JSON.stringify({ type, data, options });

  React.useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new Chart(canvasRef.current, { type, data, options });
    return () => chartRef.current?.destroy();
  }, [signature, type, data, options]);

  return (
    <div className="chart-box">
      <canvas ref={canvasRef} />
    </div>
  );
}

export function Legend({ items }) {
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

export function EmptyState({ label }) {
  return <div className="empty-state">{label}</div>;
}
