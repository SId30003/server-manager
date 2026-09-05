import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sm_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore corrupt storage
      }
    }
    setReady(true);
  }, []);

  const persist = (token, user) => {
    localStorage.setItem('sm_token', token);
    localStorage.setItem('sm_user', JSON.stringify(user));
    setUser(user);
  };

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
