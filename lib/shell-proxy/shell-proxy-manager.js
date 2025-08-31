import { BashProxyStrategy } from './bash-proxy-strategy.js';
import { PowerShellProxyStrategy } from './powershell-proxy-strategy.js';

/**
 * Shell Proxy Manager - Orchestrates cooperative control between shell and Yampp
 * Uses Registry pattern to discover functions and Strategy pattern for platform-specific proxies
 */
export class ShellProxyManager {
  constructor(platformStrategy, internalFunctionRegistry, stateManager) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.stateManager = stateManager;
    this.proxyStrategy = this.createProxyStrategy();
  }

  /**
   * Create appropriate proxy strategy based on platform
   * @returns {ShellProxyStrategy} - Platform-specific proxy strategy
   */
  createProxyStrategy() {
    const platform = this.platformStrategy.name;
    
    switch (platform) {
      case 'linux':
      case 'mac':
        return new BashProxyStrategy();
      
      case 'windows':
        return new PowerShellProxyStrategy();
      
      default:
        // Fallback to bash-like behavior
        return new BashProxyStrategy();
    }
  }

  /**
   * Generate shell proxy functions for all registered internal functions
   * @returns {string} - Shell code with all proxy function definitions
   */
  generateProxyFunctions() {
    // Get all registered function names dynamically from registry
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    // Use platform-specific strategy to generate proxies
    return this.proxyStrategy.generateProxyFunctions(functionNames);
  }

  /**
   * Prepare command with injected proxy functions  
   * @param {string} command - Original command to execute
   * @returns {Object} - Modified execution context with proxies
   */
  prepareCommandWithProxies(command) {
    const proxyFunctions = this.generateProxyFunctions();
    return this.proxyStrategy.injectProxies(command, proxyFunctions);
  }

  /**
   * Process intercept message from shell
   * @param {string} stderr - Shell error/debug output  
   * @returns {Object|null} - Parsed intercept request or null
   */
  parseInterceptRequest(stderr) {
    return this.proxyStrategy.parseInterceptMessage(stderr);
  }

  /**
   * Send response back to waiting shell
   * @param {number} processId - Shell process ID
   * @param {boolean} success - Whether operation succeeded
   * @param {Map} [pendingExports] - Variables to export to shell
   * @returns {Promise} - Response delivery promise
   */
  async sendInterceptResponse(processId, success = true, pendingExports = null) {
    const exitCode = success ? 0 : 1;
    return this.proxyStrategy.sendResponse(processId, exitCode, pendingExports);
  }

  /**
   * Check if command contains internal functions that need proxies
   * @param {string} command - Command to analyze
   * @returns {boolean} - True if command needs proxy injection
   */
  needsProxyInjection(command) {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    for (const funcName of functionNames) {
      if (command.includes(`__${funcName}`)) {
        return true;
      }
    }
    
    return false;
  }
}