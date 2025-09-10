/**
 * AST node representing a parameter definition or reference
 */
export interface AstParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'variable';
  value?: string | number | boolean;
  defaultValue?: string | number | boolean;
}