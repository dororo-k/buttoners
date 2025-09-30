export interface GameItem {
  id: string;
  name: string;
  status: 'ok' | 'repair' | 'missing';
  tags?: string[];
  notes?: string;
}

