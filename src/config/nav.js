// Sidebar items per role. Paths are relative to the role's base path.
export const NAV = {
  student: [
    { to: '', label: 'Dashboard', icon: 'home', end: true },
    { to: 'new', label: 'Raise complaint', icon: 'plus' },
    { to: 'complaints', label: 'My complaints', icon: 'list' },
    { to: 'fines', label: 'Fines', icon: 'fine' },
    { to: 'inbox', label: 'Email inbox', icon: 'mail', badge: 'unreadEmails' },
    { to: 'profile', label: 'Profile', icon: 'user' },
  ],
  warden: [
    { to: '', label: 'Dashboard', icon: 'home', end: true },
    { to: 'complaints', label: 'Block complaints', icon: 'list', badge: 'pending' },
    { to: 'fines', label: 'Fines', icon: 'fine' },
  ],
  chief: [
    { to: '', label: 'Dashboard', icon: 'home', end: true },
    { to: 'complaints', label: 'All complaints', icon: 'list', badge: 'pending' },
    { to: 'fines', label: 'Fines', icon: 'fine' },
    { to: 'performance', label: 'Warden performance', icon: 'users' },
    { to: 'analytics', label: 'Analytics', icon: 'chart' },
  ],
  dean: [
    { to: '', label: 'Dashboard', icon: 'home', end: true },
    { to: 'complaints', label: 'All complaints', icon: 'list', badge: 'pending' },
    { to: 'fines', label: 'Fines', icon: 'fine' },
    { to: 'performance', label: 'Warden performance', icon: 'users' },
    { to: 'analytics', label: 'Analytics', icon: 'chart' },
  ],
};
