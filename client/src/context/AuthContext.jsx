import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pms_user';

let sessionRestoreStarted = false;

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [initializing, setInitializing] = useState(() => !sessionRestoreStarted);

  useEffect(() => {
    if (sessionRestoreStarted) {
      setInitializing(false);
      return undefined;
    }
    sessionRestoreStarted = true;

    let active = true;

    async function restoreSession() {
      try {
        const { data } = await api.get('/auth/me');
        if (!active) return;
        setUser(data.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        } catch {
          /* ignore quota errors */
        }
      } catch {
        if (!active) return;
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) setInitializing(false);
      }
    }

    function onUnauthorized() {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }

    window.addEventListener('auth:unauthorized', onUnauthorized);
    restoreSession();

    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const applySession = useCallback((response) => {
    const { user: sessionUser, token } = response.data;
    setAuthToken(token);
    setUser(sessionUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      applySession(response);
      return response;
    },
    [applySession],
  );

  const register = useCallback(
    async (payload) => {
      const response = await api.post('/auth/register', payload);
      applySession(response);
      return response;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
