/**
 * AST node representing a command or operation
 */
export interface AstCommand {
  type: 'shell' | 'set_var' | 'call';
  content?: string;
  name?: string;
  value?: string;
  taskName?: string;
  params?: string[];
}