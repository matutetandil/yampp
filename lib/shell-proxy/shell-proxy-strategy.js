/**
 * Abstract base class for shell proxy generation strategies
 * Each platform implements its own way of generating proxy functions
 */
export class ShellProxyStrategy {
  constructor() {
    if (new.target === ShellProxyStrategy) {
      throw new Error('ShellProxyStrategy is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Generate proxy functions for all registered internal functions
   * @param {Array<string>} functionNames - List of internal function names
   * @returns {string} - Shell code with proxy function definitions
   */
  generateProxyFunctions(functionNames) {
    throw new Error('generateProxyFunctions() must be implemented by subclasses');
  }

  /**
   * Inject proxy functions into command execution
   * @param {string} command - Original command to execute
   * @param {string} proxyFunctions - Generated proxy functions
   * @returns {Object} - { shell, args, processedCommand, hasProxies }
   */
  injectProxies(command, proxyFunctions) {
    throw new Error('injectProxies() must be implemented by subclasses');
  }

  /**
   * Parse intercept message from shell output
   * @param {string} stderr - Shell error/debug output
   * @returns {Object|null} - { functionName, args, rawArgs } or null
   */
  parseInterceptMessage(stderr) {
    // Generic parsing that works for most shells
    const lines = stderr.split('\n');
    
    for (const line of lines) {
      const match = line.match(/YAMPP_INTERCEPT:([^:]+):(.*)$/);
      if (match) {
        const [, functionName, argsString] = match;
        const args = argsString ? argsString.split('|||') : [];
        
        return {
          functionName,
          args,
          rawArgs: argsString
        };
      }
    }
    
    return null;
  }

  /**
   * Create response file path for shell communication
   * @param {number} processId - Shell process ID
   * @returns {string} - Response file path
   */
  getResponseFilePath(processId) {
    throw new Error('getResponseFilePath() must be implemented by subclasses');
  }

  /**
   * Send response back to waiting shell
   * @param {number} processId - Shell process ID  
   * @param {number} exitCode - Exit code (0 = success, 1+ = failure)
   * @param {Map} [pendingExports] - Variables to export to shell
   * @returns {Promise} - File write promise
   */
  async sendResponse(processId, exitCode = 0, pendingExports = null) {
    const { promises: fs } = await import('fs');
    const responseFile = this.getResponseFilePath(processId);
    
    let content = String(exitCode);
    
    // If we have variables to export, add them to the response
    if (pendingExports && pendingExports.size > 0) {
      const exportCommands = this.generateExportCommands(pendingExports);
      if (exportCommands.trim()) {
        content += '\n' + exportCommands;
      }
    }
    
    
    return fs.writeFile(responseFile, content);
  }

  /**
   * Generate shell commands to export variables (platform-specific)
   * @param {Map} variables - Variables to export
   * @returns {string} - Shell commands to set variables
   */
  generateExportCommands(variables) {
    throw new Error('generateExportCommands() must be implemented by subclasses');
  }
}