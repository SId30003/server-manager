import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const ServerContext = createContext(null);

export function ServerProvider({ children }) {
  const { user } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.listServers();
      setServers(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setServers([]);
  }, [user, refresh]);

  const addServer = useCallback(async (payload) => {
    const created = await api.addServer(payload);
    setServers((prev) => [...prev, created]);
    return created;
  }, []);

  const removeServer = useCallback(async (id) => {
    await api.deleteServer(id);
    setServers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const testServer = useCallback(async (id) => {
    const result = await api.testServer(id);
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: result.status } : s))
    );
    return result;
  }, []);

  const markToolInstalled = useCallback((serverId, toolId) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? { ...s, installedTools: [...new Set([...(s.installedTools || []), toolId])] }
          : s
      )
    );
  }, []);

  return (
    <ServerContext.Provider
      value={{ servers, loading, refresh, addServer, removeServer, testServer, markToolInstalled }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServers() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServers must be used within ServerProvider');
  return ctx;
}
