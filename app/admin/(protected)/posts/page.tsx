import { ComingSoon } from '@/components/admin/coming-soon';

export default function AdminPostsPage() {
  return (
    <ComingSoon
      title="Posts"
      subtitle="CRUD artikel dengan MDX editor, draft state, dan publish."
      session={2}
    />
  );
}
