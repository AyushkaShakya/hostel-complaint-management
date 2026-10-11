import { createClient } from '@supabase/supabase-js';
import { IS_LIVE, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env';

export const supabase = IS_LIVE ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** Pull the readable message out of an Edge Function error. */
export async function functionErrorMessage(error, fallback) {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* response was not JSON */
  }
  return error?.message || fallback;
}
