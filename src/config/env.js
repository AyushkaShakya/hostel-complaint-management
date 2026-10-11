// Live mode turns on automatically when both Supabase values are set in .env.
// With them empty, the app runs on local demo data.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const IS_LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const NOTIFIED_NOTE = IS_LIVE
  ? 'The student has been notified.'
  : 'Email notification sent to the student (demo).';
