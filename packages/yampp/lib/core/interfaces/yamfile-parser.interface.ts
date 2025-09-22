import type { AstNode } from '../../ast/types/ast-node.js';

/**
 * Yamfile parser abstraction interface
 * Allows for different parser implementations and improved testability
 * Following Dependency Inversion Principle
 */
export interface IYamfileParser {
  /**
   * Parse Yamfile content into AST
   * @param content - Raw Yamfile content as string
   * @returns Parsed AST node
   * @throws Error if parsing fails with location information
   */
  parse(content: string): AstNode;
}