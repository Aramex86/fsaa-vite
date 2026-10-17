/* entities/project — business model + data access. */

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  budget: number;
}

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Core Banking Migration', status: 'active', budget: 120000 },
  { id: 'p2', name: 'Mobile App v2', status: 'active', budget: 86000 },
  { id: 'p3', name: 'Legacy CRM Sunset', status: 'archived', budget: 45000 },
];

/* Data access isolated here so a real API swaps in without touching features. */
export function getProjects(): Promise<Project[]> {
  return Promise.resolve(PROJECTS);
}