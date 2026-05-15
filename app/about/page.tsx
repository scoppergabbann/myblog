import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang',
  description: 'Cerita singkat, filosofi, dan perjalanan belajar.',
};

const stack = [
  { label: 'bahasa', value: 'TypeScript, Rust, Swift' },
  { label: 'frontend', value: 'Next.js, React' },
  { label: 'backend', value: 'Node, Go, Postgres' },
  { label: 'infra', value: 'Docker, Hetzner' },
  { label: 'editor', value: 'Neovim, Zed' },
  { label: 'notes', value: 'Obsidian + git' },
];

export default function AboutPage() {
  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-3 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Tentang
        </h1>
        <p className="mb-10 text-base text-[var(--color-ink-3)]">
          Software engineer, writer, dan investor pelan-pelan dari Surabaya.
        </p>

        <H2>// cerita</H2>
        <Para>
          Saya mulai menulis kode pertama kali di SMA, sebuah script PHP yang
          membaca file teks dan menampilkannya sebagai blog. Lima belas tahun
          kemudian, saya masih mencoba membangun hal yang sama—website pribadi
          yang sederhana, tapi terasa seperti rumah.
        </Para>
        <Para>
          Hari ini, saya bekerja sebagai senior engineer di sebuah startup
          fintech, fokus pada infrastruktur pembayaran yang melayani jutaan
          transaksi setiap bulan. Di luar pekerjaan, saya menulis, membaca,
          dan sesekali berinvestasi pada perusahaan yang saya percaya.
        </Para>

        <H2>// filosofi</H2>
        <Para>
          Saya percaya pada pekerjaan yang dilakukan dengan sabar. Pada proyek
          yang dibangun dalam waktu lama. Pada tulisan yang ditulis bukan
          untuk algoritma, tapi untuk satu pembaca yang kebetulan singgah di
          tempat ini.
        </Para>
        <Para>
          Internet seharusnya tetap menjadi tempat yang aneh dan personal.
          Bukan lobby hotel.
        </Para>

        <H2>// perjalanan belajar</H2>
        <Para>
          Saya belajar dengan urutan yang tidak teratur. Mulai dari PHP,
          lompat ke Python, jatuh cinta dengan JavaScript, lalu kembali ke
          fundamental—algoritma, sistem terdistribusi, basis data. Beberapa
          tahun terakhir saya juga belajar Rust dan Swift, bukan karena
          mereka populer, tapi karena saya penasaran.
        </Para>
        <Para>
          Yang saya pelajari setelah bertahun-tahun: kecepatan menguasai
          teknologi tidak sepenting kedalaman pemahaman. Lebih baik tahu satu
          hal dengan dalam daripada banyak hal dengan dangkal.
        </Para>

        <H2>// stack yang saya pakai</H2>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-[10px] max-sm:grid-cols-1">
          {stack.map((s) => (
            <div
              key={s.label}
              className="flex justify-between border-b border-[var(--color-line)] py-2 text-sm text-[var(--color-ink-2)]"
            >
              <span className="font-mono text-xs text-[var(--color-ink-3)]">
                {s.label}
              </span>
              <span>{s.value}</span>
            </div>
          ))}
        </div>

        <H2>// hubungi</H2>
        <Para>
          Saya merespon email pelan-pelan, tapi saya merespon semua:{' '}
          <a
            href="mailto:halo@belutbakarsurabaya.com"
            className="border-b border-[var(--color-line-2)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            halo@belutbakarsurabaya.com
          </a>
        </Para>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-9 mb-3.5 font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
      {children}
    </h2>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[15.5px] leading-[1.75] text-[var(--color-ink-2)]">
      {children}
    </p>
  );
}
