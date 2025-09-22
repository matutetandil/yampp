export interface Parameter {
  name: string;
  type?: 'variable' | 'literal' | 'identifier' | 'string';
  value?: any;
}