export type ProjectGroup = 'active' | 'archived';
export function projectGroup(status: string): ProjectGroup {
  return status === 'archived' ? 'archived' : 'active';
}
export function projectStatusLabel(status: string): string {
  return projectGroup(status) === 'active' ? 'Active' : 'Archived';
}
