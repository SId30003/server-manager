import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import Button from './Button';
import { IconRefresh } from './Icons';
import './ServerMetrics.css';

const REFRESH_INTERVAL_MS = 15000;

function UsageBar({ label, usedLabel, totalLabel, percent, warn }) {
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className="sm-usage">
      <div className="sm-usage__header">
        <span className="sm-usage__label">{label}</span>
        <span className="sm-usage__value mono">
          {usedLabel} <span className="sm-usage__of">/ {totalLabel}</span>
        </span>
      </div>
      <div className="sm-usage__track">
        <div
          className={`sm-usage__fill ${warn ? 'sm-usage__fill--warn' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ServerMetrics({ serverId }) {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getMetrics(serverId);
      setMetrics(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <p className="sm-metrics__status">Reading server metrics…</p>;
  }

  if (error) {
    return (
      <div className="sm-metrics__error">
        <p>{error}</p>
        <Button size="sm" variant="secondary" icon={<IconRefresh width={13} height={13} />} onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const { memory, disk, load: loadAvg, logs } = metrics;

  return (
    <div className="sm-metrics">
      <div className="sm-metrics__grid">
        {memory ? (
          <UsageBar
            label="Memory"
            usedLabel={`${memory.usedMb} MB`}
            totalLabel={`${memory.totalMb} MB`}
            percent={memory.usedPercent}
            warn={memory.usedPercent >= 85}
          />
        ) : (
          <p className="sm-metrics__unavailable">Memory usage unavailable.</p>
        )}

        {disk ? (
          <UsageBar
            label="Disk (/)"
            usedLabel={disk.used}
            totalLabel={disk.size}
            percent={disk.usedPercent}
            warn={disk.usedPercent >= 85}
          />
        ) : (
          <p className="sm-metrics__unavailable">Disk usage unavailable.</p>
        )}

        <div className="sm-metrics__load">
          <span className="sm-usage__label">Load average</span>
          <span className="sm-metrics__load-value mono">
            {loadAvg?.load1 ?? '–'} / {loadAvg?.load5 ?? '–'} / {loadAvg?.load15 ?? '–'}
          </span>
          {loadAvg?.uptime && <span className="sm-metrics__uptime">up {loadAvg.uptime}</span>}
        </div>
      </div>

      <div className="sm-metrics__logs-header">
        <span>Recent system logs</span>
        <Button size="sm" variant="ghost" icon={<IconRefresh width={13} height={13} />} onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="sm-logs">
        {logs && logs.length > 0 ? (
          logs.map((entry, i) => (
            <div className="sm-logs__row" key={i}>
              {entry.timestamp && <span className="sm-logs__time mono">{entry.timestamp}</span>}
              <span className="sm-logs__message mono">{entry.message}</span>
            </div>
          ))
        ) : (
          <p className="sm-metrics__unavailable">No log entries to show.</p>
        )}
      </div>
    </div>
  );
}
