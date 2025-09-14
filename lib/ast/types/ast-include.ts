/**
 * AST node representing an include statement
 * Enables modular Yamfile composition with intelligent merging
 */
export interface AstInclude {
  type: 'include';
  filePath: string;
  location?: any;
}