export const postKeys = {
  all:       ['posts'] as const,
  detail:    (id: string) => ['posts', 'detail', id] as const,
  drafts:    (page: number) => ['posts', 'DRAFT', 'unscheduled', page] as const,
  scheduled: () => ['posts', 'DRAFT', 'scheduled'] as const,
  published: () => ['posts', 'PUBLISHED'] as const,
  rejected:  () => ['posts', 'REJECTED'] as const,
  failed:    () => ['posts', 'FAILED'] as const,
};
