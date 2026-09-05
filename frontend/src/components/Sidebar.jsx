import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServers } from '../context/ServerContext';
import StatusDot from './StatusDot';
import AddServerModal from './AddServerModal';
import { IconGrid, IconServer, IconPlus, IconLogout } from './Icons';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { servers } = useServers();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <aside className="sm-sidebar">
      <div className="sm-sidebar__brand">
        <span className="sm-sidebar__brand-mark" />
        <span>Server Manager</span>
      </div>

      <nav className="sm-sidebar__nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sm-navitem ${isActive ? 'sm-navitem--active' : ''}`}
        >
          <IconGrid />
          <span>Dashboard</span>
        </NavLink>
      </nav>

      <div className="sm-sidebar__section">
        <div className="sm-sidebar__section-header">
          <span>Servers</span>
          <button
            className="sm-sidebar__add"
            onClick={() => setShowAddModal(true)}
            aria-label="Connect a server"
            title="Connect a server"
          >
            <IconPlus width={14} height={14} />
          </button>
        </div>

        <div className="sm-sidebar__servers">
          {servers.length === 0 && (
            <p className="sm-sidebar__empty">No servers connected yet.</p>
          )}
          {servers.map((server) => (
            <NavLink
              key={server.id}
              to={`/servers/${server.id}`}
              className={({ isActive }) => `sm-navitem sm-navitem--server ${isActive ? 'sm-navitem--active' : ''}`}
            >
              <IconServer />
              <span className="sm-navitem__label mono">{server.name}</span>
              <StatusDot status={server.status} />
            </NavLink>
          ))}
        </div>
      </div>

      <div className="sm-sidebar__footer">
        <div className="sm-sidebar__user">
          <div className="sm-sidebar__avatar">{(user?.name || '?')[0].toUpperCase()}</div>
          <div className="sm-sidebar__user-info">
            <span className="sm-sidebar__user-name">{user?.name}</span>
            <span className="sm-sidebar__user-email">{user?.email}</span>
          </div>
        </div>
        <button className="sm-sidebar__logout" onClick={logout} title="Log out">
          <IconLogout width={15} height={15} />
        </button>
      </div>

      {showAddModal && <AddServerModal onClose={() => setShowAddModal(false)} />}
    </aside>
  );
}
