import type { Project } from '@/types/content';

export const projects: Project[] = [
  {
    title: 'kawanbaca',
    description:
      'Platform diskusi buku untuk pembaca Indonesia. Membaca tidak harus sendirian.',
    stack: ['Next.js', 'Postgres', 'tRPC'],
    status: 'live',
    url: 'https://kawanbaca.example',
    github: 'https://github.com/example/kawanbaca',
  },
  {
    title: 'notebook-cli',
    description:
      'Tool CLI untuk menulis daily notes dengan format markdown dan auto-sync ke git.',
    stack: ['Rust', 'CLI'],
    status: 'live',
    github: 'https://github.com/example/notebook-cli',
  },
  {
    title: 'tatap',
    description:
      'Aplikasi reflektif harian dengan prompt yang berubah setiap minggu. Untuk yang suka journaling tapi malas.',
    stack: ['Swift', 'iOS'],
    status: 'wip',
  },
  {
    title: 'investasi-101',
    description:
      'Kumpulan tulisan tentang investasi value untuk pemula Indonesia. Tidak ada teknik trading.',
    stack: ['MDX', 'static'],
    status: 'live',
    url: '#',
  },
];
