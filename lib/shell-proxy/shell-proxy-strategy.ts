/**
 * Abstract base class for shell proxy generation strategies
 * Each platform implements its own way of generating proxy functions
 */
export abstract class ShellProxyStrategy {
  constructor() {
    if (new.target === ShellProxyStrategy) {
      throw new Error('ShellProxyStrategy is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Generate proxy functions for all registered internal functions
   * @param functionNames - List of internal function names
   * @returns Shell code with proxy function definitions
   */
  public abstract generateProxyFunctions(functionNames: string[]): string;

  /**
   * Inject proxy functions into command execution
   * @param command - Original command to execute
   * @param proxyFunctions - Generated proxy functions
   * @returns Execution context with proxy injection
   */
  public abstract injectProxies(command: string, proxyFunctions: string): any;

  /**
   * Parse intercept message from shell output
   * @param stderr - Shell error/debug output
   * @returns Parsed intercept request or null
   */
  public parseInterceptMessage(stderr: string): any | null {
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
   * @param processId - Shell process ID
   * @returns Response file path
   */
  public abstract getResponseFilePath(processId: number): string;

  /**
   * Send response back to waiting shell
   * @param processId - Shell process ID  
   * @param exitCode - Exit code (0 = success, 1+ = failure)
   * @param pendingExports - Variables to export to shell
   * @returns File write promise
   */
  public async sendResponse(
    processId: number, 
    exitCode: number = 0, 
    pendingExports: Map<string, string> | null = null,
    returnValue: string | null = null
  ): Promise<void> {
    const { promises: fs } = await import('fs');
    const responseFile = this.getResponseFilePath(processId);
    
    let content = String(exitCode);
    
    // If we have a return value, add it as second line
    if (returnValue !== null) {
      content += '\n' + returnValue;
    }
    
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
   * @param variables - Variables to export
   * @returns Shell commands to set variables
   */
  public abstract generateExportCommands(variables: Map<string, string>): string;
}