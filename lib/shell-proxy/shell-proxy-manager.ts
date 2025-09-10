import { BashProxyStrategy } from './bash-proxy-strategy.js';
import { PowerShellProxyStrategy } from './powershell-proxy-strategy.js';
import { ShellProxyStrategy } from './shell-proxy-strategy.js';
import { PlatformStrategy } from '../platform/platform-strategy.js';
import { InternalFunctionRegistry } from '../internal-functions/registry.js';
import { SharedStateManager } from '../state-sync/shared-state-manager.js';

/**
 * Shell Proxy Manager - Orchestrates cooperative control between shell and Yampp
 * Uses Registry pattern to discover functions and Strategy pattern for platform-specific proxies
 */
export class ShellProxyManager {
  private readonly platformStrategy: PlatformStrategy;
  private readonly internalFunctionRegistry: InternalFunctionRegistry;
  private readonly stateManager: SharedStateManager;
  private readonly proxyStrategy: ShellProxyStrategy;

  constructor(
    platformStrategy: PlatformStrategy, 
    internalFunctionRegistry: InternalFunctionRegistry, 
    stateManager: SharedStateManager
  ) {
    this.platformStrategy = platformStrategy;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.stateManager = stateManager;
    this.proxyStrategy = this.createProxyStrategy();
  }

  /**
   * Create appropriate proxy strategy based on platform
   * @returns Platform-specific proxy strategy
   */
  private createProxyStrategy(): ShellProxyStrategy {
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
   * @returns Shell code with all proxy function definitions
   */
  public generateProxyFunctions(): string {
    // Get all registered function names dynamically from registry
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    // Use platform-specific strategy to generate proxies
    return this.proxyStrategy.generateProxyFunctions(functionNames);
  }

  /**
   * Prepare command with injected proxy functions  
   * @param command - Original command to execute
   * @returns Modified execution context with proxies
   */
  public prepareCommandWithProxies(command: string): any {
    const proxyFunctions = this.generateProxyFunctions();
    return this.proxyStrategy.injectProxies(command, proxyFunctions);
  }

  /**
   * Process intercept message from shell
   * @param stderr - Shell error/debug output  
   * @returns Parsed intercept request or null
   */
  public parseInterceptRequest(stderr: string): any | null {
    return this.proxyStrategy.parseInterceptMessage(stderr);
  }

  /**
   * Send response back to waiting shell
   * @param processId - Shell process ID
   * @param success - Whether operation succeeded
   * @param pendingExports - Variables to export to shell
   * @returns Response delivery promise
   */
  public async sendInterceptResponse(
    processId: number, 
    success: boolean = true, 
    pendingExports: Map<string, string> | null = null,
    returnValue: string | null = null
  ): Promise<any> {
    const exitCode = success ? 0 : 1;
    return this.proxyStrategy.sendResponse(processId, exitCode, pendingExports, returnValue);
  }

  /**
   * Check if command contains internal functions that need proxies
   * @param command - Command to analyze
   * @returns True if command needs proxy injection
   */
  public needsProxyInjection(command: string): boolean {
    const functionNames = this.internalFunctionRegistry.getFunctionNames();
    
    for (const funcName of functionNames) {
      if (command.includes(`__${funcName}`)) {
        return true;
      }
    }
    
    return false;
  }
}