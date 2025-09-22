export interface ParsedParameter {
  type: 'string' | 'identifier' | 'variable' | 'params';
  value?: any;
  name?: string;
}