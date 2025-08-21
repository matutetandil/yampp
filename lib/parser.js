import { Task } from './task.js';

export class Parser {
  constructor() {
    // Regex patterns for parsing
    this.taskPattern = /^\s*(?:((?:always|serial|critical)(?:\s*:\s*|\s+))*)?(\w+)(?:\s*\(([^)]*)\))?\s*([^{\n]*?)\{([^}]*)\}/gms;
    this.commentPattern = /\/\/.*$/gm;
    this.dependencyWithParamsPattern = /(\w+)(?:\(([^)]*)\))?/g;
    this.globalVarPattern = /^\s*(const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/gm;
    this.localVarPattern = /^\s*(const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/gm;
    this.assignmentPattern = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/gm;
    this.callPattern = /^\s*_call\s+(\w+)(?:\(([^)]*)\))?\s*$/gm;
  }
  
  parse(content) {
    const tasks = new Map();
    const globalVariables = new Map();
    const globalConstants = new Map();
    const lines = content.split('\n');
    
    // Track line numbers for error reporting
    let lineMap = this.buildLineMap(content);
    
    // Remove comments first but keep line structure
    const cleanContent = this.removeComments(content);
    
    // Parse global variables and constants first
    this.parseGlobalVariables(cleanContent, globalVariables, globalConstants);
    
    // Find all task definitions
    let match;
    while ((match = this.taskPattern.exec(cleanContent)) !== null) {
      const [fullMatch, modifiersStr, taskName, parametersStr, taskClausesStr, commandsBlock] = match;
      
      // Skip variable declarations that might match the pattern
      if (fullMatch.trim().startsWith('const ') || fullMatch.trim().startsWith('var ')) {
        continue;
      }
      
      // Parse modifiers (space-separated, clean up colons)
      const modifiers = modifiersStr 
        ? modifiersStr.trim().replace(/:/g, '').split(/\s+/).filter(Boolean)
        : [];
      
      // Parse parameters
      const parameters = parametersStr
        ? parametersStr.split(',').map(p => p.trim()).filter(Boolean)
        : [];
      
      // Parse task clauses (needs and watches)
      const { dependencies, dependencyParams, watchedFiles } = this.parseTaskClauses(taskClausesStr);
      
      // Parse commands, variables, and calls
      const { commands, localVariables, localConstants, calls } = this.parseTaskContent(commandsBlock);
      
      // Get line number for error reporting
      const lineNumber = this.getLineNumber(content, match.index);
      
      // Create task
      const task = new Task({
        name: taskName,
        modifiers,
        dependencies,
        commands,
        parameters,
        dependencyParams,
        watchedFiles,
        localVariables,
        localConstants,
        calls,
        lineNumber
      });
      
      // Check for duplicate task names
      if (tasks.has(taskName)) {
        const existingTask = tasks.get(taskName);
        throw new ParseError(
          `Duplicate task definition: '${taskName}'`,
          lineNumber,
          `Task '${taskName}' was already defined at line ${existingTask.lineNumber}`
        );
      }
      
      tasks.set(taskName, task);
    }
    
    // If no tasks found, check for syntax errors
    if (tasks.size === 0) {
      this.checkForSyntaxErrors(content);
    }
    
    return { tasks, globalVariables, globalConstants };
  }
  
  removeComments(content) {
    // First remove multiline comments /* ... */
    let result = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      // Replace with same number of newlines to preserve line numbers
      return match.replace(/[^\n]/g, ' ');
    });
    
    // Then remove single-line comments but preserve line breaks
    return result.split('\n').map(line => {
      const commentIndex = line.indexOf('//');
      if (commentIndex !== -1) {
        return line.substring(0, commentIndex);
      }
      return line;
    }).join('\n');
  }
  
  parseDependenciesWithParams(dependenciesStr) {
    if (!dependenciesStr) {
      return { dependencies: [], dependencyParams: {} };
    }
    
    const dependencies = [];
    const dependencyParams = {};
    
    let match;
    this.dependencyWithParamsPattern.lastIndex = 0; // Reset regex state
    
    while ((match = this.dependencyWithParamsPattern.exec(dependenciesStr.trim())) !== null) {
      const [fullMatch, depName, paramsStr] = match;
      
      dependencies.push(depName);
      
      if (paramsStr) {
        const params = paramsStr.split(',').map(p => p.trim()).filter(Boolean);
        dependencyParams[depName] = params.map(param => {
          // If parameter starts with $, it's a variable reference
          if (param.startsWith('$')) {
            return { type: 'variable', name: param.substring(1) };
          } else {
            // Otherwise it's a literal value
            return { type: 'literal', value: param };
          }
        });
      }
    }
    
    return { dependencies, dependencyParams };
  }

  buildLineMap(content) {
    const lineMap = new Map();
    let position = 0;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      lineMap.set(position, i + 1);
      position += lines[i].length + 1; // +1 for newline
    }
    
    return lineMap;
  }
  
  getLineNumber(content, position) {
    const lines = content.substring(0, position).split('\n');
    return lines.length;
  }
  
  checkForSyntaxErrors(content) {
    const lines = content.split('\n');
    
    // Check for common syntax errors
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.endsWith('*/')) continue;
      
      // Check for unclosed braces
      if (line.includes('{') && !content.includes('}')) {
        throw new ParseError(
          'Unclosed brace found',
          lineNum,
          `Expected closing brace '}' for opening brace at line ${lineNum}`
        );
      }
      
      // Check for old bracket syntax
      if (line.match(/^\s*\[.*\]\s*:/)) {
        throw new ParseError(
          'Old bracket syntax detected',
          lineNum,
          `Use space-separated modifiers instead: "always serial: task" not "[always, serial]: task"`
        );
      }
      
      // Check for needs without task name
      if (line.match(/^\s*needs\s+/)) {
        throw new ParseError(
          'Invalid needs declaration',
          lineNum,
          `'needs' keyword must follow a task name`
        );
      }
    }
    
    // If we get here and no tasks were found, the file might be empty or invalid
    const nonEmptyLines = lines.filter(l => {
      const trimmed = l.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.endsWith('*/');
    });
    if (nonEmptyLines.length > 0) {
      throw new ParseError(
        'No valid task definitions found',
        1,
        'Yamfile must contain at least one task definition'
      );
    }
  }
  
  parseGlobalVariables(content, globalVariables, globalConstants) {
    let match;
    this.globalVarPattern.lastIndex = 0; // Reset regex state
    
    while ((match = this.globalVarPattern.exec(content)) !== null) {
      const [fullMatch, type, name, value] = match;
      const cleanValue = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      
      if (type === 'const') {
        globalConstants.set(name, cleanValue);
      } else {
        globalVariables.set(name, cleanValue);
      }
    }
  }
  
  parseTaskContent(block) {
    const commands = [];
    const localVariables = new Map();
    const localConstants = new Map();
    const calls = [];
    const lines = block.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line) continue;
      
      // Check for variable/constant declarations
      const varMatch = line.match(/^\s*(const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (varMatch) {
        const [, type, name, value] = varMatch;
        const cleanValue = value.trim().replace(/^["']|["']$/g, '');
        
        if (type === 'const') {
          localConstants.set(name, cleanValue);
        } else {
          localVariables.set(name, cleanValue);
        }
        continue;
      }
      
      // Check for variable assignments (only for vars, not consts)
      const assignMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, name, value] = assignMatch;
        const cleanValue = value.trim().replace(/^["']|["']$/g, '');
        
        // This is a reassignment, add as a command with special marker
        commands.push(`_assign ${name} = ${cleanValue}`);
        continue;
      }
      
      // Check for _call statements
      const callMatch = line.match(/^\s*_call\s+(\w+)(?:\(([^)]*)\))?\s*$/);
      if (callMatch) {
        const [, taskName, paramsStr] = callMatch;
        const params = paramsStr ? paramsStr.split(',').map(p => p.trim()).filter(Boolean) : [];
        
        calls.push({
          taskName,
          params: params.map(param => {
            if (param.startsWith('$')) {
              return { type: 'variable', name: param.substring(1) };
            } else {
              return { type: 'literal', value: param };
            }
          })
        });
        continue;
      }
      
      // Regular command
      if (line.includes('&&')) {
        const subCommands = line.split('&&').map(cmd => cmd.trim()).filter(Boolean);
        commands.push(...subCommands);
      } else {
        commands.push(line);
      }
    }
    
    return { commands, localVariables, localConstants, calls };
  }
  
  parseWatchedFiles(watchedFilesStr) {
    if (!watchedFilesStr) {
      return [];
    }
    
    // Split by spaces, but handle quoted strings properly
    const files = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    
    while ((match = regex.exec(watchedFilesStr.trim())) !== null) {
      // match[1] = double quoted, match[2] = single quoted, match[3] = unquoted
      const file = match[1] || match[2] || match[3];
      if (file) {
        files.push(file);
      }
    }
    
    return files;
  }
  
  parseTaskClauses(clausesStr) {
    if (!clausesStr) {
      return { dependencies: [], dependencyParams: {}, watchedFiles: [] };
    }
    
    const clause = clausesStr.trim();
    let dependencies = [];
    let dependencyParams = {};
    let watchedFiles = [];
    
    // Check if it contains both needs and watches
    const needsMatch = clause.match(/^needs\s+(.+?)(?:\s+watches\s+(.+))?$/);
    const watchesOnlyMatch = clause.match(/^watches\s+(.+)$/);
    
    if (needsMatch) {
      // Has needs, might have watches
      const dependenciesStr = needsMatch[1];
      const watchesStr = needsMatch[2];
      
      const result = this.parseDependenciesWithParams(dependenciesStr);
      dependencies = result.dependencies;
      dependencyParams = result.dependencyParams;
      
      if (watchesStr) {
        watchedFiles = this.parseWatchedFiles(watchesStr);
      }
    } else if (watchesOnlyMatch) {
      // Only watches, no needs
      watchedFiles = this.parseWatchedFiles(watchesOnlyMatch[1]);
    }
    
    return { dependencies, dependencyParams, watchedFiles };
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