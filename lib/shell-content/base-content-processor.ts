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
  protected readonly internalFunctionRegistry: IInternalFunctionRegistry;

  constructor(platformStrategy: PlatformStrategy, internalFunctionRegistry: IInternalFunctionRegistry) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
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
    const lines = content.split('\n');
    const processedLines: string[] = [];
    
    for (let line of lines) {
      // Process multi-line comments first (can span across strings)
      line = this.removeMultilineComments(line);
      
      // Process single-line comments (respecting strings)
      line = this.removeSingleLineComments(line);
      
      processedLines.push(line);
    }
    
    // Join lines and clean up extra whitespace
    let result = processedLines.join('\n');
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
   */
  private removeMultilineComments(line: string): string {
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inComment = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
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
    
    // Process content as-is - inline variables will be handled during execution
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      standaloneCommands.push(line);
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
    return value.trim().startsWith('__');
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
        
        // Check if this is a registered internal function
        const functionNames = this.internalFunctionRegistry.getRegisteredFunctions();
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
   * Check if content needs proxy injection (has __functions)
   */
  public needsProxyInjection(content: string): boolean {
    const functionNames = this.internalFunctionRegistry.getRegisteredFunctions();
    
    for (const funcName of functionNames) {
      if (content.includes(`__${funcName}`)) {
        return true;
      }
    }
    
    return false;
  }
}