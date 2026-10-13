import { canViewComplaint, canViewFine } from '../services/routing';

export const byNewest = (a, b) =>
  new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt);

export const visibleComplaints = (db, user) =>
  db.complaints.filter((c) => canViewComplaint(user, c)).sort(byNewest);

export const visibleFines = (db, user) =>
  db.fines.filter((f) => canViewFine(user, f, db)).sort(byNewest);

export const getUser = (db, id) => db.users.find((u) => u.id === id);

export const countBy = (items, key) =>
  items.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
