import { Task } from './models/index.js';
import { platformDetector } from './platform/index.js';
import { AstToTaskConverter } from './parser/ast-to-task-converter.js';
import { ParseError } from './parser/parse-error.js';
import type { ParseResult } from './ast/types/parse-result.js';
import type { AstNode } from './ast/types/ast-node.js';
import { parse as peggyParse } from './yamfile-parser.js';

export class Parser {
  private readonly astConverter: AstToTaskConverter;

  constructor() {
    this.astConverter = new AstToTaskConverter();
  }
  
  public parse(content: string): ParseResult {
    try {
      // Parse the content using Peggy
      const ast: AstNode = peggyParse(content);
      
      // Convert AST to our internal format
      const tasks = new Map<string, Task>();
      const globalVariables = new Map<string, any>();
      const globalConstants = new Map<string, any>();
      const globalEnvironmentVariables = new Map<string, any>();
      
      // Process global variables and constants
      for (const variable of ast.variables) {
        globalVariables.set(variable.name, variable.value);
      }
      
      for (const constant of ast.constants) {
        globalConstants.set(constant.name, constant.value);
      }
      
      // Process global environment variables
      for (const envVar of ast.environmentVariables || []) {
        globalEnvironmentVariables.set(envVar.name, process.env[envVar.name] || '');
      }
      
      // Process platform blocks using Strategy pattern
      for (const platformBlock of ast.platformBlocks || []) {
        // Check if current platform matches any of the block's platforms
        if (platformDetector.platformMatches(platformBlock.platforms)) {
          // Add all tasks from this platform block
          for (const taskAst of platformBlock.tasks) {
            const task = this.astConverter.convert(this.adaptAstTaskToTaskAstNode(taskAst));
            // Mark as platform-specific for debugging
            (task as any).platforms = platformBlock.platforms;
            
            // Check for duplicates
            if (tasks.has(task.getName())) {
              throw new Error(`Duplicate task '${task.getName()}' in platform block @${platformBlock.platforms.join(' @')}`);
            }
            
            tasks.set(task.getName(), task);
          }
        }
      }
      
      // Process regular tasks (no platform restrictions)
      for (const taskAst of ast.tasks) {
        const task = this.astConverter.convert(this.adaptAstTaskToTaskAstNode(taskAst));
        
        // Check for duplicates
        if (tasks.has(task.getName())) {
          const existingTask = tasks.get(task.getName());
          throw new ParseError(
            `Duplicate task definition: '${task.getName()}'`,
            (taskAst as any).location?.start?.line || 0,
            `Task '${task.getName()}' was already defined`
          );
        }
        
        tasks.set(task.getName(), task);
      }
      
      return { tasks, globalVariables, globalConstants, globalEnvironmentVariables };
      
    } catch (error: any) {
      // Handle Peggy parse errors
      if (error.location) {
        const line = error.location.start.line;
        const column = error.location.start.column;
        const excerpt = ParseError.getLineExcerpt(content, line, column);
        
        throw new ParseError(
          error.message,
          line,
          `at column ${column}${excerpt}`,
          content
        );
      }
      throw error;
    }
  }

  /**
   * Adapt AstTask to TaskAstNode interface
   * Converts the Peggy parser output to our internal AST format
   */
  private adaptAstTaskToTaskAstNode(astTask: any): import('./ast/nodes/task-ast-node.js').TaskAstNode {
    return {
      name: astTask.name,
      dependencies: astTask.dependencies || [],
      dependencyParams: astTask.dependencyParams || {},
      modifiers: astTask.modifiers || [],
      commands: astTask.commands?.map((cmd: any) => typeof cmd === 'string' ? cmd : cmd.text) || [],
      parameters: astTask.parameters || [],
      watchedFiles: astTask.watches || [],
      internalFunctions: astTask.internalFunctions || [], // FIX: Map internalFunctions from parser result
      calls: astTask.calls || [], // Also map calls for completeness
      inputs: astTask.inputs || [], // And inputs
      localVariables: astTask.localVariables || [], // FIX: Map localVariables from parser result
      localConstants: astTask.localConstants || [], // FIX: Map localConstants from parser result  
      localEnvironmentVariables: astTask.localEnvironmentVariables || [], // FIX: Map localEnvironmentVariables from parser result
      location: (astTask as any).location
    };
  }
  
  // Compatibility methods from old parser
  public removeComments(content: string): string {
    // This is now handled by the Peggy grammar itself
    return content;
  }
  
  public parseDependenciesWithParams(dependenciesStr: string): { dependencies: string[]; dependencyParams: Record<string, any> } {
    // This method is kept for backward compatibility but not used
    return { dependencies: [], dependencyParams: {} };
  }
  
  public parseWatchedFiles(watchedFilesStr: string): string[] {
    // This method is kept for backward compatibility but not used
    return [];
  }
  
  public parseTaskClauses(clausesStr: string): { dependencies: string[]; dependencyParams: Record<string, any>; watchedFiles: string[] } {
    // This method is kept for backward compatibility but not used
    return { dependencies: [], dependencyParams: {}, watchedFiles: [] };
  }
  
  public parseGlobalVariables(content: string, globalVariables: Map<string, any>, globalConstants: Map<string, any>): void {
    // This method is kept for backward compatibility but not used
    // The Peggy parser handles this directly
  }
  
  public parseTaskContent(block: string): { commands: string[]; localVariables: Map<string, any>; localConstants: Map<string, any>; calls: any[] } {
    // This method is kept for backward compatibility but not used
    return { commands: [], localVariables: new Map(), localConstants: new Map(), calls: [] };
  }
  
  public buildLineMap(content: string): Map<any, any> {
    // This method is kept for backward compatibility but not used
    return new Map();
  }
  
  public getLineNumber(content: string, position: number): number {
    // This method is kept for backward compatibility but not used
    return 0;
  }
  
  public checkForSyntaxErrors(content: string): void {
    // This method is kept for backward compatibility but not used
    // Peggy provides better error messages
  }
}