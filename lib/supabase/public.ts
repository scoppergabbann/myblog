import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase client — anon key, no cookies, no session.
 *
 * Use this for public reads (posts, projects, now, home, about) in pages
 * that need to remain static / ISR. Anything that calls `createSupabaseServer()`
 * forces the page into dynamic mode because it reads `cookies()`.
 *
 * RLS still applies (anon role), so only data with public read policies
 * is accessible. Admin-only tables (e.g. `dumel`) remain inaccessible.
 *
 * Safe to call at build time and in cached server components.
 */
export function createSupabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Don't try to persist session — there's no browser/cookie context.
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
