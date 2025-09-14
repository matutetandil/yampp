import type { AstNode } from '../../ast/types/ast-node.js';

/**
 * Represents a resolved include file with its parsed AST
 * Contains both original and resolved paths for error reporting
 */
export interface ResolvedInclude {
  filePath: string;
  resolvedPath: string;
  ast: AstNode;
  location?: any;
}