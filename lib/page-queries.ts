import { createSupabaseServer } from './supabase/server';
import type {
  HomeData,
  AboutData,
  QuickLink,
  StackItem,
} from '@/types/content';

const HOME_FALLBACK: HomeData = {
  monoLabel: '~/halo',
  heroIntro: 'Sudut sepi di internet untuk',
  heroAccent1: 'menulis',
  heroAccent2: 'membangun',
  heroAccent3: 'memikirkan ulang',
  heroOutro: '.',
  lead: 'Saya seorang software engineer yang juga menulis dan berinvestasi pelan-pelan. Tempat ini adalah catatan kepala saya—proyek yang sedang dibangun, tulisan yang sedang dimasak, dan refleksi yang belum selesai.',
  location: 'Surabaya, Indonesia',
  timezone: 'UTC+7',
  estYear: 'est. 2026',
  focusTitle: 'Membangun tatap, aplikasi journaling untuk iOS',
  focusBody:
    'Membaca ulang Designing Data-Intensive Applications. Belajar bahasa Jepang menuju N3. Mengurangi screen time di malam hari dan kembali ke buku fisik.',
  quickLinks: [
    { id: -1, label: 'tentang saya', href: '/about' },
    { id: -2, label: 'apa yang sedang saya kerjakan', href: '/now' },
    { id: -3, label: 'tinggalkan pesan', href: '/guestbook' },
    { id: -4, label: 'rss feed', href: '/rss.xml' },
  ],
};

export async function getHomeData(): Promise<HomeData> {
  try {
    const supabase = await createSupabaseServer();

    const [metaRes, linksRes] = await Promise.all([
      supabase
        .from('home_meta')
        .select(
          'mono_label, hero_intro, hero_accent_1, hero_accent_2, hero_accent_3, hero_outro, lead, location, timezone, est_year, focus_title, focus_body'
        )
        .eq('id', 1)
        .maybeSingle(),
      supabase
        .from('home_quick_links')
        .select('id, label, href')
        .order('display_order', { ascending: false })
        .order('id', { ascending: true }),
    ]);

    if (metaRes.error || !metaRes.data) {
      // Table likely doesn't exist yet — return fallback so page still renders
      return HOME_FALLBACK;
    }

    const m = metaRes.data;
    const quickLinks: QuickLink[] =
      (linksRes.data ?? []).length > 0
        ? (linksRes.data as QuickLink[])
        : HOME_FALLBACK.quickLinks;

    return {
      monoLabel: m.mono_label,
      heroIntro: m.hero_intro,
      heroAccent1: m.hero_accent_1,
      heroAccent2: m.hero_accent_2,
      heroAccent3: m.hero_accent_3,
      heroOutro: m.hero_outro,
      lead: m.lead,
      location: m.location,
      timezone: m.timezone,
      estYear: m.est_year,
      focusTitle: m.focus_title,
      focusBody: m.focus_body,
      quickLinks,
    };
  } catch {
    return HOME_FALLBACK;
  }
}

const ABOUT_FALLBACK: AboutData = {
  title: 'Tentang',
  subtitle: 'Software engineer, writer, dan investor pelan-pelan dari Surabaya.',
  content: '',
  contactEmail: 'halo@belutbakarsurabaya.com',
  contactIntro:
    'Saya merespon email pelan-pelan, tapi saya merespon semua:',
  stack: [],
};

export async function getAboutData(): Promise<AboutData> {
  try {
    const supabase = await createSupabaseServer();
    const [metaRes, stackRes] = await Promise.all([
      supabase
        .from('about_meta')
        .select('title, subtitle, content, contact_email, contact_intro')
        .eq('id', 1)
        .maybeSingle(),
      supabase
        .from('about_stack')
        .select('id, label, value')
        .order('display_order', { ascending: false })
        .order('id', { ascending: true }),
    ]);

    if (metaRes.error || !metaRes.data) return ABOUT_FALLBACK;
    const m = metaRes.data;

    return {
      title: m.title,
      subtitle: m.subtitle,
      content: m.content,
      contactEmail: m.contact_email,
      contactIntro: m.contact_intro,
      stack: (stackRes.data ?? []) as StackItem[],
    };
  } catch {
    return ABOUT_FALLBACK;
  }
}
