import { ComingSoon } from '@/components/admin/coming-soon';

export default function AdminCommentsPage() {
  return (
    <ComingSoon
      title="Comments"
      subtitle="Moderasi komentar per artikel: approve, reject, delete."
      session={2}
    />
  );
}
