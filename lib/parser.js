import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import peggy from 'peggy';
import { Task } from './models/index.js';
import { platformDetector } from './platform/index.js';
import { AstToTaskConverter } from './parser/ast-to-task-converter.js';
import { ParseError } from './parser/parse-error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and compile the Peggy grammar
const grammarPath = resolve(__dirname, 'yamfile.pegjs');
const grammarSource = readFileSync(grammarPath, 'utf-8');
// Grammar loaded and compiled
const parser = peggy.generate(grammarSource, { trace: false });

export class Parser {
  constructor() {
    this.parser = parser;
    this.astConverter = new AstToTaskConverter();
  }
  
  parse(content) {
    try {
      // Parse the content using Peggy
      const ast = this.parser.parse(content);
      
      // Convert AST to our internal format
      const tasks = new Map();
      const globalVariables = new Map();
      const globalConstants = new Map();
      const globalEnvironmentVariables = new Map();
      
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
            const task = this.astConverter.convert(taskAst);
            // Mark as platform-specific for debugging
            task.platforms = platformBlock.platforms;
            
            // Check for duplicates
            if (tasks.has(task.name)) {
              throw new Error(`Duplicate task '${task.name}' in platform block @${platformBlock.platforms.join(' @')}`);
            }
            
            tasks.set(task.name, task);
          }
        }
      }
      
      // Process regular tasks (no platform restrictions)
      for (const taskAst of ast.tasks) {
        const task = this.astConverter.convert(taskAst);
        
        // Check for duplicates
        if (tasks.has(task.name)) {
          const existingTask = tasks.get(task.name);
          throw new ParseError(
            `Duplicate task definition: '${task.name}'`,
            taskAst.location?.start?.line || 0,
            `Task '${task.name}' was already defined`
          );
        }
        
        tasks.set(task.name, task);
      }
      
      return { tasks, globalVariables, globalConstants, globalEnvironmentVariables };
      
    } catch (error) {
      // Handle Peggy parse errors
      if (error.location) {
        throw new ParseError(
          error.message,
          error.location.start.line,
          `at column ${error.location.start.column}`
        );
      }
      throw error;
    }
  }
  
  
  // Compatibility methods from old parser
  removeComments(content) {
    // This is now handled by the Peggy grammar itself
    return content;
  }
  
  parseDependenciesWithParams(dependenciesStr) {
    // This method is kept for backward compatibility but not used
    return { dependencies: [], dependencyParams: {} };
  }
  
  parseWatchedFiles(watchedFilesStr) {
    // This method is kept for backward compatibility but not used
    return [];
  }
  
  parseTaskClauses(clausesStr) {
    // This method is kept for backward compatibility but not used
    return { dependencies: [], dependencyParams: {}, watchedFiles: [] };
  }
  
  parseGlobalVariables(content, globalVariables, globalConstants) {
    // This method is kept for backward compatibility but not used
    // The Peggy parser handles this directly
  }
  
  parseTaskContent(block) {
    // This method is kept for backward compatibility but not used
    return { commands: [], localVariables: new Map(), localConstants: new Map(), calls: [] };
  }
  
  buildLineMap(content) {
    // This method is kept for backward compatibility but not used
    return new Map();
  }
  
  getLineNumber(content, position) {
    // This method is kept for backward compatibility but not used
    return 0;
  }
  
  checkForSyntaxErrors(content) {
    // This method is kept for backward compatibility but not used
    // Peggy provides better error messages
  }
}