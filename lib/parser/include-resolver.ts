import { resolve, dirname, isAbsolute } from 'path';
import type { AstNode } from '../ast/types/ast-node.js';
import type { AstInclude } from '../ast/types/ast-include.js';
import type { IncludeContext } from './types/include-context.js';
import type { ResolvedInclude } from './types/resolved-include.js';
import type { IFileSystem, IYamfileParser } from '../core/interfaces/index.js';

/**
 * Resolves and parses included Yamfiles with circular dependency detection
 * and intelligent path resolution
 * 
 * Following Dependency Inversion Principle - depends on abstractions, not concretions
 */
export class IncludeResolver {
  private static readonly MAX_INCLUDE_DEPTH = 10;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly parser: IYamfileParser
  ) {}

  /**
   * Resolve all includes from an AST node
   * @param ast - Root AST containing include statements
   * @param context - Resolution context with base path and circular detection
   * @returns Array of resolved includes with their parsed ASTs
   */
  public resolveIncludes(ast: AstNode, context: IncludeContext): ResolvedInclude[] {
    if (!ast.includes || ast.includes.length === 0) {
      return [];
    }

    const resolvedIncludes: ResolvedInclude[] = [];

    for (const includeNode of ast.includes) {
      try {
        const resolved = this.resolveInclude(includeNode, context);
        resolvedIncludes.push(resolved);
        
        // Recursively resolve includes from included files
        const nestedContext: IncludeContext = {
          basePath: dirname(resolved.resolvedPath),
          resolvedPaths: new Set(context.resolvedPaths),
          includeDepth: context.includeDepth + 1
        };
        
        const nestedIncludes = this.resolveIncludes(resolved.ast, nestedContext);
        resolvedIncludes.push(...nestedIncludes);
        
      } catch (error: any) {
        throw new Error(`Failed to resolve include '${includeNode.filePath}': ${error.message}`);
      }
    }

    return resolvedIncludes;
  }

  /**
   * Resolve a single include statement
   * @param includeNode - Include AST node
   * @param context - Resolution context
   * @returns Resolved include with parsed AST
   */
  private resolveInclude(includeNode: AstInclude, context: IncludeContext): ResolvedInclude {
    // Check include depth to prevent infinite recursion
    if (context.includeDepth >= IncludeResolver.MAX_INCLUDE_DEPTH) {
      throw new Error(`Maximum include depth (${IncludeResolver.MAX_INCLUDE_DEPTH}) exceeded. Possible circular dependency.`);
    }

    // Resolve file path (relative to current file or absolute)
    const resolvedPath = this.resolvePath(includeNode.filePath, context.basePath);

    // Check for circular dependencies
    if (context.resolvedPaths.has(resolvedPath)) {
      throw new Error(`Circular include dependency detected: ${resolvedPath}`);
    }

    // Check file exists using abstraction
    if (!this.fileSystem.exists(resolvedPath)) {
      throw new Error(`Include file not found: ${resolvedPath}`);
    }

    // Add to resolved paths to detect future circular dependencies
    context.resolvedPaths.add(resolvedPath);

    try {
      // Read and parse the included file using abstractions
      const content = this.fileSystem.readFile(resolvedPath);
      const ast: AstNode = this.parser.parse(content);

      return {
        filePath: includeNode.filePath,
        resolvedPath: resolvedPath,
        ast: ast,
        location: includeNode.location
      };
      
    } catch (error: any) {
      // Enhanced error handling with file context
      throw new Error(`Failed to process include '${resolvedPath}': ${error.message}`);
    }
  }

  /**
   * Resolve file path relative to base path or as absolute
   * @param filePath - File path from include statement
   * @param basePath - Base directory for relative path resolution
   * @returns Absolute resolved path
   */
  private resolvePath(filePath: string, basePath: string): string {
    if (isAbsolute(filePath)) {
      return filePath;
    }
    
    // Resolve relative to the directory containing the current file
    return resolve(basePath, filePath);
  }
}