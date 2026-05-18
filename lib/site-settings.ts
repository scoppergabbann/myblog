import { createSupabasePublic } from './supabase/public';

export type SiteSettings = {
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEta: string | null;
  maintenanceContact: string | null;
};

const DEFAULT_SETTINGS: SiteSettings = {
  maintenanceEnabled: false,
  maintenanceTitle: 'Sedang dalam perbaikan',
  maintenanceMessage:
    'Halamannya lagi di-update sebentar. Balik lagi ya — nuhun banyak!',
  maintenanceEta: null,
  maintenanceContact: null,
};

// In-memory cache — survives between requests within the same serverless
// instance, but gets reset on cold start (which is fine).
// TTL: 60 seconds. Toggle in admin will be reflected within 1 minute.
type CachedSettings = {
  settings: SiteSettings;
  expiresAt: number;
};
let cache: CachedSettings | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Fetch current site settings with 60s in-memory cache.
 * Falls back to defaults if DB query fails (fail-open: don't lock out site).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.settings;
  }

  try {
    const supabase = createSupabasePublic();
    const { data, error } = await supabase
      .from('site_settings')
      .select(
        'maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_contact'
      )
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      // Fail-open: if we can't reach DB, don't put site in maintenance
      console.error('[site-settings.read]', error);
      return DEFAULT_SETTINGS;
    }

    const settings: SiteSettings = {
      maintenanceEnabled: data.maintenance_enabled ?? false,
      maintenanceTitle: data.maintenance_title || DEFAULT_SETTINGS.maintenanceTitle,
      maintenanceMessage:
        data.maintenance_message || DEFAULT_SETTINGS.maintenanceMessage,
      maintenanceEta: data.maintenance_eta || null,
      maintenanceContact: data.maintenance_contact || null,
    };

    cache = { settings, expiresAt: now + CACHE_TTL_MS };
    return settings;
  } catch (err) {
    console.error('[site-settings.read] exception', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Invalidate cache after admin updates settings.
 * Called from server action so next request fetches fresh.
 */
export function invalidateSiteSettingsCache() {
  cache = null;
}
