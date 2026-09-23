import { timingSafeEqual } from 'node:crypto';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return json({ ok: false, error: 'Cron is not configured' }, 503);

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    const lastSeenAt = new Date().toISOString();
    const supabase = createSupabaseAdmin();
    const { data, error: readError } = await supabase
      .from('database_heartbeat')
      .select('last_seen_at')
      .eq('id', 1)
      .abortSignal(AbortSignal.timeout(10_000))
      .maybeSingle();
    if (readError) {
      console.error('Supabase heartbeat read failed', { code: readError.code });
      return json({ ok: false, error: 'Database heartbeat unavailable' }, 503);
    }

    // Compare WIB calendar dates to tolerate Vercel Hobby's hourly scheduling window.
    const wibDay = (timestamp: string) => Math.floor((Date.parse(timestamp) + 7 * 60 * 60 * 1000) / 86_400_000);
    if (data && wibDay(lastSeenAt) - wibDay(data.last_seen_at) < 3) {
      return json({ ok: true, skipped: true, lastSeenAt: data.last_seen_at });
    }

    const { error } = await supabase
      .from('database_heartbeat')
      .upsert({ id: 1, last_seen_at: lastSeenAt }, { onConflict: 'id' })
      .abortSignal(AbortSignal.timeout(10_000));
    if (error) {
      console.error('Supabase heartbeat failed', { code: error.code });
      return json({ ok: false, error: 'Database heartbeat failed' }, 503);
    }
    return json({ ok: true, lastSeenAt });
  } catch {
    console.error('Supabase heartbeat unavailable');
    return json({ ok: false, error: 'Database heartbeat unavailable' }, 503);
  }
}
