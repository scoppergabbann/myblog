import type { Metadata } from 'next';
import { GuestbookClient } from './guestbook-client';

export const metadata: Metadata = {
  title: 'Buku tamu',
  description: 'Tinggalkan pesan, salam, atau apapun.',
};

const initialEntries = [
  {
    name: 'Anonim dari Bandung',
    date: '2026-05-12',
    msg: 'Baru pertama kali ke sini dari HN. Suka banget vibesnya, terasa seperti blog 2010-an. Keep writing!',
  },
  {
    name: 'rifqi',
    date: '2026-05-08',
    msg: 'Artikel tentang menulis untuk diri sendiri sangat relate. Saya juga baru pindah dari Medium ke blog personal bulan lalu.',
  },
  {
    name: 'sarah',
    date: '2026-05-03',
    msg: 'Hai dari Tokyo! Suka design site ini, calm banget. Btw nama belutbakarsurabaya bikin saya lapar :)',
  },
  {
    name: 'pak budi',
    date: '2026-04-28',
    msg: 'Sebagai bapak-bapak yang baru mulai belajar coding, blog seperti ini sangat menenangkan dibanding twitter dev.',
  },
];

export default function GuestbookPage() {
  return (
    <div className="page-fade mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        <h1 className="mb-2 text-[36px] font-medium tracking-[-0.035em] text-[var(--color-ink)] max-sm:text-[28px]">
          Buku tamu
        </h1>
        <p className="mb-9 text-[15.5px] text-[var(--color-ink-3)]">
          Tinggalkan pesan, salam, atau apapun. Saya senang tahu siapa yang
          singgah ke sini.
        </p>
        <GuestbookClient initialEntries={initialEntries} />
      </div>
    </div>
  );
}
