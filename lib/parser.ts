import { dirname, resolve } from 'path';
import { Task } from './models/index.js';
import { platformDetector } from './platform/index.js';
import { AstToTaskConverter } from './parser/ast-to-task-converter.js';
import { ParseError } from './parser/parse-error.js';
import { ProfileFilter } from './execution/profile-filter.js';
import { IncludeResolver } from './parser/include-resolver.js';
import { SmartMerger } from './parser/smart-merger.js';
import { NodeFileSystem, PeggyYamfileParser } from './core/services/index.js';
import type { IncludeContext } from './parser/types/include-context.js';
import type { MergeContext } from './parser/types/merge-context.js';
import type { ParseResult } from './ast/types/parse-result.js';
import type { AstNode } from './ast/types/ast-node.js';
import { AstTaskAdapter } from './ast/adapters/ast-task-adapter.js';
import type { IAstTaskAdapter } from './ast/interfaces/ast-task-adapter.interface.js';
import { parse as peggyParse } from './yamfile-parser.js';
import type { ParseOptions } from './parser/types/parse-options.interface.js';

export class Parser {
  private readonly astConverter: AstToTaskConverter;
  private readonly includeResolver: IncludeResolver;

  constructor() {
    this.astConverter = new AstToTaskConverter();
    
    // Inject concrete implementations following DIP
    const fileSystem = new NodeFileSystem();
    const parser = new PeggyYamfileParser();
    this.includeResolver = new IncludeResolver(fileSystem, parser);
  }
  
  public parse(content: string, options: ParseOptions = {}): ParseResult {
    try {
      // Parse the main content using Peggy
      const mainAst: AstNode = peggyParse(content);
      
      // Resolve active profiles
      const activeProfiles = this.resolveActiveProfiles(options.profiles || [], mainAst.defaultProfile);
      
      // Handle includes if present
      let finalAst = mainAst;
      if (mainAst.includes && mainAst.includes.length > 0) {
        finalAst = this.processIncludes(mainAst, activeProfiles, options.filePath || 'Yamfile');
      }
      
      // Convert merged AST to internal format
      return this.convertAstToInternalFormat(finalAst, activeProfiles);
      
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
   * Process includes with smart merging and profile filtering
   */
  private processIncludes(mainAst: AstNode, activeProfiles: string[], mainFilePath: string): AstNode {
    // Set up include resolution context
    const includeContext: IncludeContext = {
      basePath: dirname(resolve(mainFilePath)),
      resolvedPaths: new Set([resolve(mainFilePath)]),
      includeDepth: 0
    };

    // Resolve all includes recursively
    const resolvedIncludes = this.includeResolver.resolveIncludes(mainAst, includeContext);

    // Smart merge with profile awareness
    const smartMerger = new SmartMerger(activeProfiles);
    const mergeContext: MergeContext = {
      activeProfiles: activeProfiles,
      mainFilePath: mainFilePath
    };

    return smartMerger.merge(mainAst, resolvedIncludes, mergeContext);
  }

  /**
   * Convert final merged AST to internal Task format
   */
  private convertAstToInternalFormat(ast: AstNode, activeProfiles: string[]): ParseResult {
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
    
    // Process annotation blocks (profiles + nested platforms)
    if (ast.annotationBlocks && ast.annotationBlocks.length > 0) {
      const profileFilter = new ProfileFilter({ profiles: activeProfiles });
      const profileTasks = profileFilter.extractTasksFromBlocks(ast.annotationBlocks);
      
      for (const taskAst of profileTasks) {
        const task = this.astConverter.convert(this.adaptAstTaskToTaskAstNode(taskAst));
        
        // Mark with profile context for debugging
        if ((taskAst as any)._profileContext) {
          (task as any).profileContext = (taskAst as any)._profileContext;
        }
        
        // Check for duplicates
        if (tasks.has(task.getName())) {
          const existingTask = tasks.get(task.getName());
          const context = (taskAst as any)._profileContext || ['unknown'];
          throw new ParseError(
            `Duplicate task definition: '${task.getName()}'`,
            (taskAst as any).location?.start?.line || 0,
            `Task '${task.getName()}' in profile context [@${context.join(' @')}] was already defined`
          );
        }
        
        tasks.set(task.getName(), task);
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
  }

  /**
   * Resolve active profiles based on CLI input and default profile
   * @param cliProfiles - Profiles specified via --profile flags
   * @param defaultProfile - Default profile declared in Yamfile
   * @returns Array of active profiles to use
   */
  private resolveActiveProfiles(cliProfiles: string[], defaultProfile?: string | null): string[] {
    // CLI profiles take precedence over default
    if (cliProfiles.length > 0) {
      return cliProfiles;
    }
    
    // Use default profile if no CLI profiles and default exists
    if (defaultProfile) {
      return [defaultProfile];
    }
    
    // No profiles active - don't process any annotation blocks
    return [];
  }

  /**
   * Adapt AstTask to TaskAstNode interface using SOLID principles
   * Converts the Peggy parser output to our internal AST format
   * Uses AstTaskAdapter to encapsulate AST access
   */
  private adaptAstTaskToTaskAstNode(astTask: any): import('./ast/nodes/task-ast-node.js').TaskAstNode {
    const adapter: IAstTaskAdapter = new AstTaskAdapter(astTask);
    
    return {
      name: adapter.getName(),
      dependencies: adapter.getDependencies(),
      dependencyParams: adapter.getDependencyParams(),
      modifiers: adapter.getModifiers(),
      commands: adapter.getCommands(),
      parameters: adapter.getParameters(),
      watchedFiles: adapter.getWatchedFiles(),
      internalFunctions: adapter.getInternalFunctions(),
      calls: adapter.getCalls(),
      inputs: adapter.getInputs(),
      localVariables: adapter.getLocalVariables(),
      localConstants: adapter.getLocalConstants(),
      localEnvironmentVariables: adapter.getLocalEnvironmentVariables(),
      location: adapter.getLocation()
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