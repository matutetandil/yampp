export interface TaskDisplayData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  output: string[];
  startTime: number;
  endTime?: number;
  duration?: string;
  command?: string | null;
  hasError: boolean;
  collapsed?: boolean;
}