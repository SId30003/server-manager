import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ServerProvider } from '../context/ServerContext';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <ServerProvider>
      <div className="sm-layout">
        <Sidebar />
        <main className="sm-layout__content">
          <Outlet />
        </main>
      </div>
    </ServerProvider>
  );
}
