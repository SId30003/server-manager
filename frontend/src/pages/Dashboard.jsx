import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServers } from '../context/ServerContext';
import StatusDot from '../components/StatusDot';
import Button from '../components/Button';
import AddServerModal from '../components/AddServerModal';
import { IconPlus, IconChevronRight, IconRefresh, IconTrash } from '../components/Icons';
import './Dashboard.css';

export default function Dashboard() {
  const { servers, testServer, removeServer } = useServers();
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const online = servers.filter((s) => s.status === 'online').length;
  const offline = servers.filter((s) => s.status === 'offline').length;

  const handleTest = async (id, e) => {
    e.stopPropagation();
    setBusyId(id);
    try {
      await testServer(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Disconnect this server? This only removes it from Server Manager.')) return;
    await removeServer(id);
  };

  return (
    <div className="sm-page">
      <div className="sm-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of every server connected to your account.</p>
        </div>
        <Button icon={<IconPlus width={15} height={15} />} onClick={() => setShowAdd(true)}>
          Connect server
        </Button>
      </div>

      <div className="sm-stats">
        <div className="sm-stat">
          <span className="sm-stat__value">{servers.length}</span>
          <span className="sm-stat__label">Connected</span>
        </div>
        <div className="sm-stat">
          <span className="sm-stat__value" style={{ color: 'var(--success)' }}>
            {online}
          </span>
          <span className="sm-stat__label">Online</span>
        </div>
        <div className="sm-stat">
          <span className="sm-stat__value" style={{ color: 'var(--danger)' }}>
            {offline}
          </span>
          <span className="sm-stat__label">Offline</span>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="sm-empty">
          <p>No servers connected yet.</p>
          <Button variant="secondary" icon={<IconPlus width={15} height={15} />} onClick={() => setShowAdd(true)}>
            Connect your first server
          </Button>
        </div>
      ) : (
        <div className="sm-server-list">
          {servers.map((server) => (
            <div
              key={server.id}
              className="sm-server-row"
              onClick={() => navigate(`/servers/${server.id}`)}
            >
              <StatusDot status={server.status} />
              <div className="sm-server-row__main">
                <span className="sm-server-row__name mono">{server.name}</span>
                <span className="sm-server-row__meta mono">
                  {server.username}@{server.host}:{server.port}
                </span>
              </div>
              <span className="sm-server-row__tools">
                {(server.installedTools || []).length} tool
                {(server.installedTools || []).length === 1 ? '' : 's'} installed
              </span>
              <div className="sm-server-row__actions">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<IconRefresh width={13} height={13} />}
                  loading={busyId === server.id}
                  onClick={(e) => handleTest(server.id, e)}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<IconTrash width={13} height={13} />}
                  onClick={(e) => handleDelete(server.id, e)}
                >
                  Remove
                </Button>
              </div>
              <IconChevronRight width={16} height={16} className="sm-server-row__chevron" />
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddServerModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
