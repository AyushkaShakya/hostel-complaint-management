import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(() => {
    setLoadError(null);
    api
      .loadDatabase()
      .then((data) => {
        setDb(data);
        const sid = api.getSessionUserId();
        setUserId(data.users.some((u) => u.id === sid) ? sid : null);
      })
      .catch(() => setLoadError('The demo data could not be loaded.'));
  }, []);

  useEffect(load, [load]);

  const refresh = () => setDb(api.snapshot());

  // Wrap an API call so the UI re-reads data after it succeeds.
  const run = useCallback(async (fn) => {
    const result = await fn();
    setDb(api.snapshot());
    return result;
  }, []);

  const value = useMemo(() => {
    const user = db && userId ? db.users.find((u) => u.id === userId) : null;
    return {
      db,
      ready: Boolean(db),
      loadError,
      retryLoad: load,
      user,
      login: async (role, email, password) => {
        const id = await api.login(role, email, password);
        setDb(api.snapshot());
        setUserId(id);
        return id;
      },
      signup: async (role, data) => {
        const result = await run(() => api.signup(role, data));
        if (typeof result === 'string') setUserId(result);
        return result; // { needsConfirmation: true } when email confirmation is on
      },
      logout: async () => {
        await api.logout();
        setUserId(null);
        setDb(api.snapshot());
      },
      createComplaint: (input) => run(() => api.createComplaint(userId, input)),
      updateStatus: (id, status, note) => run(() => api.updateComplaintStatus(userId, id, status, note)),
      issueFine: (input) => run(() => api.issueFine(userId, input)),
      recordPayment: (fineId, payment) => run(() => api.recordFinePayment(userId, fineId, payment)),
      updateNickname: (nickname) => run(() => api.updateNickname(userId, nickname)),
      markEmailRead: (id) => run(() => api.markEmailRead(id)),
      resetDemo: async () => {
        await api.resetDemo();
        refresh();
      },
    };
  }, [db, userId, loadError, load, run]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
