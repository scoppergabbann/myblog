import { ComingSoon } from '@/components/admin/coming-soon';

export default function AdminViewsPage() {
  return (
    <ComingSoon
      title="Views"
      subtitle="Statistik view counter per artikel, top articles."
      session={3}
    />
  );
}
