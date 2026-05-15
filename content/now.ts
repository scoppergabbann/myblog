import type { NowData } from '@/types/content';

export const nowData: NowData = {
  updated: '2026-05-10',
  learning: [
    {
      role: 'reading',
      text: 'The Pragmatic Programmer (20th anniversary edition)—setelah 5 tahun pertama kali baca, banyak yang baru saya pahami.',
    },
    {
      role: 'course',
      text: 'Mengerjakan ulang database internals sambil membaca buku Designing Data-Intensive Applications.',
    },
    {
      role: 'language',
      text: 'Belajar bahasa Jepang lewat Anki, sudah masuk N4. Lambat tapi konsisten.',
    },
  ],
  working: [
    {
      role: 'work',
      text: 'Senior engineer di sebuah startup fintech, fokus pada infrastruktur pembayaran.',
    },
    {
      role: 'side',
      text: 'Menulis konsisten satu artikel per minggu di sini.',
    },
    {
      role: 'project',
      text: 'Membangun ulang tatap—aplikasi journaling minimalis untuk iOS.',
    },
  ],
  consuming: [
    { role: 'book', text: '"Tomorrow, and Tomorrow, and Tomorrow" — Gabrielle Zevin' },
    { role: 'music', text: 'Album baru Nujabes (anumerta), playlist Tycho untuk fokus.' },
    { role: 'game', text: 'Outer Wilds—main pelan-pelan, suka diam dan memikirkan misterinya.' },
    { role: 'film', text: 'Perfect Days karya Wim Wenders. Film tentang menerima rutinitas.' },
  ],
  focus:
    'Kesehatan tidur dan menulis tanpa tekanan. Mengurangi screen time di malam hari, berjalan pagi minimal 3x seminggu, dan kembali ke kebiasaan membaca fisik sebelum tidur.',
};
