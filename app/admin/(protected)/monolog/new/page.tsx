import { MonologEditor } from '../monolog-editor';
import { getAdminMonologCategories } from '@/lib/monolog-category-queries';

export default async function NewMonologPage() {
  const categories = await getAdminMonologCategories();
  return <MonologEditor categories={categories} />;
}
