import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import peggy from 'peggy';
import { Task } from './task.js';

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
  }
  
  parse(content) {
    try {
      // Parse the content using Peggy
      const ast = this.parser.parse(content);
      
      // Convert AST to our internal format
      const tasks = new Map();
      const globalVariables = new Map();
      const globalConstants = new Map();
      
      // Process global variables and constants
      for (const variable of ast.variables) {
        globalVariables.set(variable.name, variable.value);
      }
      
      for (const constant of ast.constants) {
        globalConstants.set(constant.name, constant.value);
      }
      
      // Process tasks
      for (const taskAst of ast.tasks) {
        const task = this.convertAstToTask(taskAst);
        
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
      
      return { tasks, globalVariables, globalConstants };
      
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
  
  convertAstToTask(taskAst) {
    // Convert local variables and constants to Maps
    const localVariables = new Map();
    const localConstants = new Map();
    
    for (const variable of taskAst.localVariables || []) {
      localVariables.set(variable.name, variable.value);
    }
    
    for (const constant of taskAst.localConstants || []) {
      localConstants.set(constant.name, constant.value);
    }
    
    // Process dependency parameters to match expected format
    const dependencyParams = {};
    for (const [depName, params] of Object.entries(taskAst.dependencyParams || {})) {
      dependencyParams[depName] = params.map(param => {
        if (typeof param === 'object' && param.type) {
          return param; // Already in correct format
        }
        // Legacy format conversion
        if (typeof param === 'string' && param.startsWith('$')) {
          return { type: 'variable', name: param.substring(1) };
        }
        return { type: 'literal', value: param };
      });
    }
    
    // Process calls to match expected format
    const calls = (taskAst.calls || []).map(call => ({
      taskName: call.taskName,
      params: call.parameters || []
    }));
    
    // Extract inputs
    const inputs = (taskAst.inputs || []).map(input => ({
      type: input.inputType,
      prompt: input.prompt,
      variable: input.variable,
      defaultValue: input.defaultValue,
      options: input.options || []
    }));
    
    // Create Task instance
    return new Task({
      name: taskAst.name,
      modifiers: taskAst.modifiers || [],
      dependencies: taskAst.dependencies || [],
      commands: taskAst.commands || [],
      parameters: taskAst.parameters || [],
      dependencyParams: dependencyParams,
      watchedFiles: taskAst.watchedFiles || [],
      localVariables: localVariables,
      localConstants: localConstants,
      calls: calls,
      inputs: inputs,
      internalFunctions: taskAst.internalFunctions || [],
      lineNumber: taskAst.location?.start?.line || null
    });
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

export class ParseError extends Error {
  constructor(message, line, context) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.context = context;
  }
}