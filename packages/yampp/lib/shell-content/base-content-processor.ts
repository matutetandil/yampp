import { PlatformStrategy } from '../platform/types/platform-strategy.js';
import { IInternalFunctionRegistry } from '../internal-functions/internal-function-registry.interface.js';
import { ExecutionContext } from '../execution/types/execution-context.js';

/**
 * Represents a variable or constant assignment
 */
interface VariableAssignment {
  type: 'variable' | 'constant';
  name: string;
  value: string;
  isInternalFunction: boolean;
}

/**
 * Pre-processed data structure for language-agnostic representation
 */
interface PreProcessedData {
  variableAssignments: VariableAssignment[];
  standaloneCommands: string[];
  originalContent: string;
}

/**
 * Base Shell Content Processor
 * Abstract base class for processing shell content with Strategy pattern
 * Handles universal Yampp comment filtering and platform-specific processing
 */
export abstract class BaseContentProcessor {
  protected readonly platformStrategy: PlatformStrategy;
  protected readonly functionRegistry: IInternalFunctionRegistry;

  constructor(platformStrategy: PlatformStrategy, internalFunctionRegistry: IInternalFunctionRegistry) {
    this.platformStrategy = platformStrategy;
    this.functionRegistry = internalFunctionRegistry;
  }


  /**
   * Main processing pipeline - template method pattern
   */
  public process(content: string, localVariables?: any[], localConstants?: any[]): ExecutionContext {
    // Step 1: UNIVERSAL - Remove Yampp DSL comments (REQUIRED for all platforms)
    let processedContent = this.cleanYamppComments(content);
    
    // Step 2: PLATFORM-SPECIFIC - Remove shell-specific comments (OPTIONAL)
    processedContent = this.cleanShellComments(processedContent);
    
    // Step 3: UNIVERSAL - Pre-process variables with internal functions
    const preProcessedData = this.preProcess(processedContent, localVariables, localConstants);
    
    // Step 4: PLATFORM-SPECIFIC - Generate target language code
    processedContent = this.generateTargetCode(preProcessedData);
    
    // Step 5: Inject proxy functions for __* intercepts
    const executionContext = this.injectProxies(processedContent);
    
    return executionContext;
  }

  /**
   * UNIVERSAL: Remove Yampp DSL comments - REQUIRED for all processors
   * Filters single-line and multi-line style comments from Yamfile DSL
   * Respects string contexts to avoid filtering comments inside strings
   */
  protected cleanYamppComments(content: string): string {
    // Process multi-line comments first (they can span multiple lines)
    let result = this.removeMultilineComments(content);
    
    // Then process single-line comments line by line
    const lines = result.split('\n');
    const processedLines: string[] = [];
    
    for (let line of lines) {
      // Process single-line comments (respecting strings)
      line = this.removeSingleLineComments(line);
      processedLines.push(line);
    }
    
    // Join lines and clean up extra whitespace
    result = processedLines.join('\n');
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return result;
  }
  
  /**
   * Remove single-line comments while respecting string contexts
   */
  private removeSingleLineComments(line: string): string {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      // Handle escape sequences
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }
      
      // Toggle quote states
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        continue;
      }
      
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        result += char;
        continue;
      }
      
      // Check for comments only outside of strings
      if (!inSingleQuote && !inDoubleQuote) {
        // Check for // comment
        if (char === '/' && nextChar === '/') {
          // Rest of line is a comment
          break;
        }
        
        // Check for # comment at start of line or after whitespace
        if (char === '#') {
          if (i === 0 || (i > 0 && line.charAt(i - 1).match(/\s/))) {
            // Rest of line is a comment
            break;
          }
        }
      }
      
      result += char;
    }
    
    return result.trimEnd();
  }
  
  /**
   * Remove multi-line comments while respecting string contexts
   * Processes entire content at once to handle comments spanning multiple lines
   */
  private removeMultilineComments(content: string): string {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inComment = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      
      // Handle escape sequences
      if (escaped) {
        if (!inComment) result += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        if (!inComment) result += char;
        continue;
      }
      
      // Toggle quote states (only outside comments)
      if (!inComment) {
        if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          result += char;
          continue;
        }
        
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          result += char;
          continue;
        }
      }
      
      // Check for comment markers only outside of strings
      if (!inSingleQuote && !inDoubleQuote) {
        // Start of multi-line comment
        if (!inComment && char === '/' && nextChar === '*') {
          inComment = true;
          i++; // Skip the *
          continue;
        }
        
        // End of multi-line comment
        if (inComment && char === '*' && nextChar === '/') {
          inComment = false;
          i++; // Skip the /
          continue;
        }
      }
      
      // Only add characters if not in a comment
      if (!inComment) {
        result += char;
      }
    }
    
    return result;
  }

  /**
   * PLATFORM-SPECIFIC: Remove shell-specific comments - OPTIONAL override
   * Default implementation does nothing (preserves shell comments)
   */
  protected cleanShellComments(content: string): string {
    // Default: preserve shell comments (no filtering)
    // Subclasses can override to filter platform-specific comments
    return content;
  }

  /**
   * UNIVERSAL: Pre-process content to detect variables with internal functions
   * This is language-agnostic and creates an intermediate representation
   */
  protected preProcess(content: string, localVariables?: any[], localConstants?: any[]): PreProcessedData {
    const variableAssignments: VariableAssignment[] = [];
    const standaloneCommands: string[] = [];
    
    // Process local variables from parser (task-level variables)
    if (localVariables) {
      for (const variable of localVariables) {
        if (this.isInternalFunctionCall(variable.value)) {
          variableAssignments.push({
            type: 'variable',
            name: variable.name,
            value: variable.value,
            isInternalFunction: true
          });
        } else {
          variableAssignments.push({
            type: 'variable',
            name: variable.name,
            value: variable.value,
            isInternalFunction: false
          });
        }
      }
    }
    
    // Process local constants from parser (task-level constants)
    if (localConstants) {
      for (const constant of localConstants) {
        if (this.isInternalFunctionCall(constant.value)) {
          variableAssignments.push({
            type: 'constant',
            name: constant.name,
            value: constant.value,
            isInternalFunction: true
          });
        } else {
          variableAssignments.push({
            type: 'constant',
            name: constant.name,
            value: constant.value,
            isInternalFunction: false
          });
        }
      }
    }
    
    // NOTE: We do NOT extract inline variables here anymore
    // They need to be processed in their execution context (if/case/for)
    // to respect control flow
    
    // First normalize plugin functions to internal function format
    const normalizedContent = this.transformFunctionCallsToProxies(content);

    // Process content and transform inline variable assignments to proxies
    const lines = normalizedContent.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const transformedLine = this.transformAssignmentsToProxies(line);
      standaloneCommands.push(transformedLine);
    }
    
    return {
      variableAssignments,
      standaloneCommands,
      originalContent: content
    };
  }
  
  /**
   * Check if a value is an internal function call
   */
  protected isInternalFunctionCall(value: string): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();

    // Check for traditional internal functions starting with __
    if (trimmed.startsWith('__')) {
      return true;
    }

    // Check for plugin functions with pattern: plugin-name::function-name
    const pluginFunctionPattern = /^[\w-]+::\w+/;
    if (pluginFunctionPattern.test(trimmed)) {
      return true;
    }

    return false;
  }
  
  /**
   * ABSTRACT: Generate target language code from pre-processed data
   * Each subclass implements this for their specific language (bash, PowerShell, Python, etc.)
   */
  protected abstract generateTargetCode(data: PreProcessedData): string;
  
  /**
   * ABSTRACT: Inject proxy functions - MUST be implemented by subclasses
   * Transforms __func(args) syntax and injects platform-specific proxy functions
   */
  protected abstract injectProxies(content: string): ExecutionContext;

  /**
   * ADVANCED: Extract inline variable assignments anywhere in content
   * Detects patterns like: var name = __input "prompt" "default"
   * Returns cleaned content and extracted assignments
   */
  protected extractInlineVariables(content: string): { assignments: VariableAssignment[], cleanedContent: string } {
    const assignments: VariableAssignment[] = [];
    let cleanedContent = content;
    
    // Pattern to match: (var|const) identifier = __functionName args
    // Handles multi-line and various whitespace scenarios
    const inlineVariablePattern = /^(\s*)(var|const)\s+(\w+)\s*=\s*(__\w+.*?)$/gm;
    
    let match;
    while ((match = inlineVariablePattern.exec(content)) !== null) {
      const [fullMatch, indentation, type, variableName, functionCall] = match;
      
      // Parse the function call to extract function name and arguments
      const functionMatch = functionCall.match(/^(__\w+)(.*)$/);
      if (functionMatch) {
        const [, funcName, argsString] = functionMatch;
        
        // Check if this is a registered function
        const functionNames = this.functionRegistry.getRegisteredFunctions();
        const funcNameWithoutPrefix = funcName.substring(2); // Remove __

        if (functionNames.includes(funcNameWithoutPrefix)) {
          // This is an internal function assignment
          assignments.push({
            type: type as 'variable' | 'constant',
            name: variableName,
            value: functionCall.trim(),
            isInternalFunction: true
          });
          
          // Remove this line from the content
          cleanedContent = cleanedContent.replace(fullMatch, '');
        }
      }
    }
    
    // Clean up extra blank lines left by removals
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanedContent = cleanedContent.replace(/^\s*\n/, ''); // Remove leading blank lines
    
    return {
      assignments,
      cleanedContent
    };
  }

  /**
   * Check if content needs proxy injection (has any registered functions)
   */
  public needsProxyInjection(content: string): boolean {
    const functionNames = this.functionRegistry.getRegisteredFunctions();

    // Check for any registered functions (internal + plugins)
    for (const funcName of functionNames) {
      // Check for internal function format: __funcName
      if (content.includes(`__${funcName}`)) {
        return true;
      }

      // Check for plugin function format: plugin::func
      // Function names with plugin prefix like "plugin_func" need to be checked as "plugin::func"
      if (funcName.includes('_')) {
        const parts = funcName.split('_');
        if (parts.length >= 2) {
          const pluginName = parts.slice(0, -1).join('-'); // Convert back to original plugin name
          const functionName = parts[parts.length - 1];
          const pluginCall = `${pluginName}::${functionName}`;
          if (content.includes(pluginCall)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Transform variable assignments to proxy function calls
   * var x = "value" → __assign var x "value"
   * var x = __input "prompt" → keep as is (handled by existing system)
   */
  protected transformAssignmentsToProxies(line: string): string {
    // Pattern to match variable assignments: (var|const) name = value
    const assignmentPattern = /^(\s*)(var|const)\s+(\w+)\s*=\s*(.+?)$/;
    const match = line.match(assignmentPattern);

    if (match) {
      const [, indentation, type, varName, value] = match;

      // Check if the value is an internal function call (starts with __)
      if (value && this.isInternalFunctionCall(value.trim())) {
        // Don't transform - let the existing system handle internal functions
        return line;
      }

      // Transform simple assignments to proxy function call
      // Pass the value as-is to the platform-specific processor
      return `${indentation}__assign ${type} ${varName} ${value}`;
    }

    return line;
  }

  /**
   * Transform plugin function calls to internal function format
   * plugin::func → __plugin__func (unified naming for existing proxy system)
   * Also normalize plugin function syntax from parentheses to space-separated format
   */
  protected transformFunctionCallsToProxies(content: string): string {
    // First normalize plugin functions to internal function format
    let result = content.replace(/([\w-]+)::([\w]+)/g, (match, pluginName, funcName) => {
      return `__${pluginName.replace(/-/g, '_')}_${funcName}`;
    });

    // Then normalize plugin function syntax from ("arg1", "arg2") to "arg1" "arg2"
    // This ensures all internal functions have consistent syntax for all processors
    result = result.replace(/__(\w+)\((.*?)\)/g, (match, funcName, args) => {
      if (args.trim()) {
        // Parse arguments respecting quotes and convert to space-separated
        const cleanArgs = this.parseAndNormalizeFunctionArgs(args);
        return `__${funcName} ${cleanArgs}`;
      } else {
        return `__${funcName}`;
      }
    });

    return result;
  }

  /**
   * Parse function arguments and normalize to space-separated format
   * Converts ("arg1", "arg2", 123) to "arg1" "arg2" 123
   */
  private parseAndNormalizeFunctionArgs(args: string): string {
    // Simple parser for comma-separated arguments respecting quotes
    const parsedArgs: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < args.length; i++) {
      const char = args[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        currentArg += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        currentArg += char;
      } else if (!inQuotes && char === ',') {
        parsedArgs.push(currentArg.trim());
        currentArg = '';
      } else {
        currentArg += char;
      }
    }

    if (currentArg.trim()) {
      parsedArgs.push(currentArg.trim());
    }

    return parsedArgs.join(' ');
  }
}