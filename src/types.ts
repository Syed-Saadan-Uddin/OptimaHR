export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  category: string;
}

export interface Stat {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export type Screen = 'dashboard' | 'tasks' | 'settings' | 'analytics';
