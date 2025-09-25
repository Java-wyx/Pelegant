
export interface CleaningRule {
  id: number;
  name: string;
  type: 'filter' | 'transform' | 'normalize' | 'deduplicate';
  target: 'title' | 'content' | 'url' | 'date' | 'all';
  condition: string;
  status: 'active' | 'inactive' | 'draft';
  lastRun: string;
  createdAt: string;
}

export interface CleaningTask {
  id: number;
  name: string;
  rules: number[];
  dataSource: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  lastRun: string;
  duration: string;
  recordsProcessed: number;
  recordsChanged: number;
}

export interface CleanedData {
  id: number;
  title: string;
  originalContent: string;
  cleanedContent: string;
  source: string;
  cleaningTask: number;
  cleanedAt: string;
  status: 'improved' | 'unchanged' | 'error';
}
