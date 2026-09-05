import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServers } from '../context/ServerContext';
import { api } from '../api/client';
import StatusDot from '../components/StatusDot';
import Button from '../components/Button';
import ToolInstaller from '../components/ToolInstaller';
import ServerTerminal from '../components/ServerTerminal';
import ServerMetrics from '../components/ServerMetrics';
import { IconRefresh, IconTrash } from '../components/Icons';
import './ServerDetail.css';

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { servers, testServer, removeServer, markToolInstalled } = useServers();
  const [tab, setTab] = useState('overview');
  const [tools, setTools] = useState([]);
  const [testing, setTesting] = useState(false);

  const server = servers.find((s) => s.id === id);

  useEffect(() => {
    api.listTools().then(setTools).catch(() => {});
  }, []);

  if (!server) {
    return (
      <div className="sm-page">
        <p className="sm-detail__missing">
          This server isn't in your list. It may have been removed.
        </p>
      </div>
    );
  }

  const handleTest = async () => {
    setTesting(true);
    try {
      await testServer(server.id);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Disconnect "${server.name}"? This only removes it from Server Manager.`)) return;
    await removeServer(server.id);
    navigate('/dashboard');
  };

  return (
    <div className="sm-page">
      <div className="sm-detail__header">
        <div className="sm-detail__title">
          <StatusDot status={server.status} />
          <h1 className="mono">{server.name}</h1>
        </div>
        <div className="sm-detail__actions">
          <Button
            size="sm"
            variant="secondary"
            icon={<IconRefresh width={13} height={13} />}
            loading={testing}
            onClick={handleTest}
          >
            Test connection
          </Button>
          <Button size="sm" variant="danger" icon={<IconTrash width={13} height={13} />} onClick={handleDelete}>
            Disconnect
          </Button>
        </div>
      </div>
      <p className="sm-detail__address mono">
        {server.username}@{server.host}:{server.port}
      </p>

      <div className="sm-tabs" style={{ marginTop: 24, marginBottom: 22 }}>
        {['overview', 'tools', 'monitor', 'terminal'].map((key) => (
          <button
            key={key}
            className={`sm-tab ${tab === key ? 'sm-tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {{ overview: 'Overview', tools: 'Tools', monitor: 'Monitor', terminal: 'Terminal' }[key]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="sm-overview">
          <div className="sm-overview__item">
            <span>Status</span>
            <StatusDot status={server.status} showLabel />
          </div>
          <div className="sm-overview__item">
            <span>Authentication</span>
            <span>{server.authType === 'key' ? 'SSH key' : 'Password'}</span>
          </div>
          <div className="sm-overview__item">
            <span>Connected since</span>
            <span>{new Date(server.createdAt).toLocaleString()}</span>
          </div>
          <div className="sm-overview__item">
            <span>Installed tools</span>
            <span>{(server.installedTools || []).length === 0 ? 'None yet' : server.installedTools.join(', ')}</span>
          </div>
          {server.lastError && (
            <div className="sm-overview__item">
              <span>Last error</span>
              <span style={{ color: 'var(--danger)' }}>{server.lastError}</span>
            </div>
          )}
        </div>
      )}

      {tab === 'tools' && (
        <ToolInstaller
          tools={tools}
          serverId={server.id}
          installedTools={server.installedTools || []}
          onInstalled={(toolId) => markToolInstalled(server.id, toolId)}
        />
      )}

      {tab === 'monitor' && <ServerMetrics serverId={server.id} />}

      {tab === 'terminal' && (
        <div style={{ height: '65vh' }}>
          <ServerTerminal serverId={server.id} />
        </div>
      )}
    </div>
  );
}
