import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user, loading,
    async login(credentials) {
      const { data } = await authApi.login(credentials);
      if (data.token) localStorage.setItem('taskflow_token', data.token);
      setUser(data.user);
      return data.user;
    },
    async register(values) {
      const { data } = await authApi.register(values);
      if (data.token) localStorage.setItem('taskflow_token', data.token);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        localStorage.removeItem('taskflow_token');
        setUser(null);
      }
    },
    updateUser(next) { setUser(next); },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
