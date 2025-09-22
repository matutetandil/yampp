export interface ExecutionContext {
  shell: string;
  args?: string[];
  hasProxies: boolean;
  content: string;
}