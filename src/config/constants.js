// Roles and their portal URL segments.
export const ROLES = {
  student: {
    key: 'student',
    label: 'Student',
    path: 'student',
    blurb: 'Raise complaints under your nickname, follow their status, and pay fines online.',
  },
  warden: {
    key: 'warden',
    label: 'Warden',
    path: 'warden',
    blurb: 'Resolve complaints from your block and manage fines for its students.',
  },
  chief: {
    key: 'chief',
    label: 'Chief Warden',
    path: 'chief-warden',
    blurb: 'Oversee every block, complaints against wardens, and warden performance.',
  },
  dean: {
    key: 'dean',
    label: 'Dean',
    path: 'dean',
    blurb: 'Institution-wide oversight, including ragging and harassment cases.',
  },
};

export const ROLE_LIST = Object.values(ROLES);
export const roleFromPath = (path) => ROLE_LIST.find((r) => r.path === path);

export const BLOCKS = ['A', 'B', 'C', 'D'];

export const STATUSES = ['pending', 'in_progress', 'resolved'];
export const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// Routes:
//   'warden' -> Warden of the student's block, visible upward to Chief Warden and Dean
//   'bypass' -> skips the named Warden, goes to Chief Warden and Dean
//   'dean'   -> straight to the Dean (student may hide it from the Chief Warden)
//
// The synopsis names Washroom, Electricity, Wi-Fi, Complaint against Warden and
// Ragging/Harassment and says there are twelve categories in total. The other
// seven below are placeholders: replace them with your final list.
export const CATEGORIES = [
  { key: 'washroom', label: 'Washroom', route: 'warden' },
  { key: 'electricity', label: 'Electricity', route: 'warden' },
  { key: 'wifi', label: 'Wi-Fi', route: 'warden' },
  { key: 'water', label: 'Water supply', route: 'warden' },
  { key: 'plumbing', label: 'Plumbing', route: 'warden' },
  { key: 'mess', label: 'Mess and food', route: 'warden' },
  { key: 'cleanliness', label: 'Cleanliness', route: 'warden' },
  { key: 'furniture', label: 'Furniture and fittings', route: 'warden' },
  { key: 'pest', label: 'Pest control', route: 'warden' },
  { key: 'security', label: 'Security', route: 'warden' },
  { key: 'against_warden', label: 'Complaint against Warden', route: 'bypass' },
  { key: 'ragging', label: 'Ragging / Harassment', route: 'dean' },
];

export const categoryOf = (key) => CATEGORIES.find((c) => c.key === key);
export const categoryLabel = (key) => categoryOf(key)?.label ?? key;

export const ROUTE_LABEL = {
  warden: 'Routine',
  bypass: 'Against Warden',
  dean: 'Ragging / Harassment',
};
