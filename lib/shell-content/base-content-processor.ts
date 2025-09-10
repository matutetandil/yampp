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
   */
  protected cleanYamppComments(content: string): string {
    // Remove single-line comments: // comment
    content = content.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments: /* comment */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Clean up extra whitespace left by comment removal
    content = content.replace(/\n\s*\n/g, '\n');
    
    return content;
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
    
    // Process local variables looking for internal function assignments
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
    
    // Process local constants looking for internal function assignments
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
    
    // Split content into standalone commands
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