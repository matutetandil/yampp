/**
 * Base Shell Content Processor
 * Abstract base class for processing shell content with Strategy pattern
 * Handles universal Yampp comment filtering and platform-specific processing
 */
export class BaseContentProcessor {
  constructor(platformStrategy, internalFunctionRegistry) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
  }

  /**
   * Main processing pipeline - template method pattern
   * @param {string} content - Raw task content from Yamfile
   * @returns {Object} - Processed execution context
   */
  process(content) {
    // Step 1: UNIVERSAL - Remove Yampp DSL comments (REQUIRED for all platforms)
    let processedContent = this.cleanYamppComments(content);
    
    // Step 2: PLATFORM-SPECIFIC - Remove shell-specific comments (OPTIONAL)
    processedContent = this.cleanShellComments(processedContent);
    
    // Step 3: Inject proxy functions for __* intercepts
    const executionContext = this.injectProxies(processedContent);
    
    return executionContext;
  }

  /**
   * UNIVERSAL: Remove Yampp DSL comments - REQUIRED for all processors
   * Filters single-line and multi-line style comments from Yamfile DSL
   * @param {string} content - Raw content
   * @returns {string} - Content without Yampp comments
   */
  cleanYamppComments(content) {
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
   * @param {string} content - Content after Yampp comment removal
   * @returns {string} - Content after shell comment processing
   */
  cleanShellComments(content) {
    // Default: preserve shell comments (no filtering)
    // Subclasses can override to filter platform-specific comments
    return content;
  }

  /**
   * ABSTRACT: Inject proxy functions - MUST be implemented by subclasses
   * Transforms __func(args) syntax and injects platform-specific proxy functions
   * @param {string} content - Processed content ready for execution
   * @returns {Object} - Execution context with shell, args, hasProxies, etc.
   */
  injectProxies(content) {
    throw new Error('injectProxies() must be implemented by subclass');
  }

  /**
   * Check if content needs proxy injection (has __functions)
   * @param {string} content - Content to check
   * @returns {boolean} - True if proxy injection needed
   */
  needsProxyInjection(content) {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    for (const funcName of functionNames) {
      if (content.includes(`__${funcName}`)) {
        return true;
      }
    }
    
    return false;
  }
}