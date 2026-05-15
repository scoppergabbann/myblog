import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yang saya pakai',
  description: 'Hardware, software, dan tools yang saya pakai sehari-hari.',
};

type UsesItem = { key: string; value: string; note?: string };

const sections: { title: string; items: UsesItem[] }[] = [
  {
    title: '// editor & terminal',
    items: [
      {
        key: 'editor',
        value: 'Neovim dengan LazyVim',
        note: 'sudah 4 tahun, masih belajar',
      },
      {
        key: 'gui editor',
        value: 'Zed',
        note: 'untuk pair programming dan exploring codebase baru',
      },
      { key: 'terminal', value: 'Ghostty + tmux' },
      { key: 'shell', value: 'fish + starship' },
      { key: 'font', value: 'JetBrains Mono untuk coding, Inter untuk UI' },
    ],
  },
  {
    title: '// hardware',
    items: [
      { key: 'laptop', value: 'MacBook Pro 14" M2 (16GB)' },
      { key: 'monitor', value: 'Dell U2723QE 27" 4K' },
      { key: 'keyboard', value: 'Keychron Q1 Pro', note: 'silent brown switches' },
      { key: 'mouse', value: 'Logitech MX Master 3S' },
      {
        key: 'audio',
        value: 'AirPods Pro untuk fokus, Sony WH-1000XM4 untuk perjalanan',
      },
      { key: 'notebook', value: 'Moleskine A5 dotted + Lamy Safari' },
    ],
  },
  {
    title: '// software harian',
    items: [
      { key: 'notes', value: 'Obsidian dengan vault di git private' },
      { key: 'tasks', value: 'Things 3', note: 'sederhana, tidak ada distraksi' },
      {
        key: 'reading',
        value: 'Readwise Reader untuk artikel, Kindle Oasis untuk buku',
      },
      { key: 'browser', value: 'Arc untuk kerja, Safari untuk reading' },
      { key: 'music', value: 'Spotify', note: 'playlist instrumental untuk fokus' },
      { key: 'password', value: '1Password' },
    ],
  },
  {
    title: '// hosting & infra',
    items: [
      { key: 'hosting', value: 'Vercel untuk site ini, Hetzner untuk proyek lain' },
      { key: 'domain', value: 'Namecheap' },
      { key: 'analytics', value: 'Plausible', note: 'privacy-first, tanpa cookies' },
      { key: 'email', value: 'Fastmail dengan domain sendiri' },
    ],
  },
];

export default function UsesPage() {
  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-3 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Yang saya pakai
        </h1>
        <p className="mb-10 text-base text-[var(--color-ink-3)]">
          Hardware, software, dan tools yang saya pakai sehari-hari. Diperbarui
          sesekali.
        </p>

        {sections.map((s) => (
          <section key={s.title} className="mb-9">
            <h2 className="mb-4 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
              {s.title}
            </h2>
            <div className="flex flex-col">
              {s.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-baseline gap-5 border-b border-[var(--color-line)] py-3 last:border-b-0"
                >
                  <span className="min-w-[110px] flex-shrink-0 font-mono text-[12.5px] text-[var(--color-ink-3)]">
                    {item.key}
                  </span>
                  <span className="text-[14.5px] text-[var(--color-ink-2)]">
                    {item.value}
                    {item.note && (
                      <span className="text-[13px] text-[var(--color-ink-3)]">
                        {' '}
                        — {item.note}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="mt-12 text-[13.5px] text-[var(--color-ink-3)]">
          Halaman ini terinspirasi dari{' '}
          <a
            href="https://uses.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-[var(--color-line-2)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            uses.tech
          </a>
          —koleksi halaman /uses dari engineer dan kreator di seluruh dunia.
        </p>
      </div>
    </div>
  );
}
