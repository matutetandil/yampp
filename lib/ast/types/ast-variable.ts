/**
 * AST node representing a variable declaration
 */
export interface AstVariable {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
}