import { parse as peggyParse } from '../../yamfile-parser.js';
import type { AstNode } from '../../ast/types/ast-node.js';
import type { IYamfileParser } from '../interfaces/yamfile-parser.interface.js';

/**
 * Peggy-based Yamfile parser implementation
 * Concrete implementation of IYamfileParser using Peggy parser
 */
export class PeggyYamfileParser implements IYamfileParser {
  /**
   * Parse Yamfile content using Peggy parser
   */
  public parse(content: string): AstNode {
    try {
      return peggyParse(content);
    } catch (error: any) {
      // Re-throw with enhanced error information
      if (error.location) {
        const line = error.location.start.line;
        const column = error.location.start.column;
        throw new Error(`Parse error at line ${line}:${column}: ${error.message}`);
      }
      throw error;
    }
  }
}