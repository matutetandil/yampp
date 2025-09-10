/**
 * AST node representing a constant declaration
 */
export interface AstConstant {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
}