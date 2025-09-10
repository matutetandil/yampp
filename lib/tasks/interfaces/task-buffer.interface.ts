import { LineInfo } from '../../output/interfaces/line-info.interface.js';

export interface TaskBuffer {
  name: string;
  lines: LineInfo[];
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: string;
}