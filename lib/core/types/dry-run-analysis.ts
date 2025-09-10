export interface DryRunAnalysis {
  willExecute: number;
  cached: number;
  totalCommands: number;
  platforms: string[];
  modifiers: string[];
  estimatedTime: string;
}