import { ComingSoon } from '@/components/admin/coming-soon';

export default function AdminSubscribersPage() {
  return (
    <ComingSoon
      title="Subscribers"
      subtitle="Newsletter subscribers: confirm, delete, export CSV."
      session={3}
    />
  );
}
