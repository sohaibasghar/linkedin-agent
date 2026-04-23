export type SidebarView = 'generate' | 'drafts' | 'scheduled' | 'history';

export function tomorrowLocal(): string {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
