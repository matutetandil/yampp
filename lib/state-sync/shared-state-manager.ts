import { PlatformStrategy } from '../platform/platform-strategy.js';

export interface StateDebugInfo {
  sharedState: Record<string, any>;
  shellContext: Record<string, any>;
  internalContext: Record<string, any>;
  pendingExports: Record<string, any>;
}

/**
 * Abstract base class for shared state management between shell and internal functions
 * Provides bidirectional synchronization of variables and context
 */
export abstract class SharedStateManager {
  protected readonly platformStrategy: PlatformStrategy;
  protected readonly sharedState: Map<string, any>;
  protected readonly shellContext: Map<string, any>;
  protected readonly internalContext: Map<string, any>;
  protected readonly pendingExports: Map<string, any>;

  constructor(platformStrategy: PlatformStrategy) {
    if (new.target === SharedStateManager) {
      throw new Error('SharedStateManager is abstract and cannot be instantiated directly');
    }
    
    this.platformStrategy = platformStrategy;
    this.sharedState = new Map(); // Central state store
    this.shellContext = new Map(); // Current shell variables
    this.internalContext = new Map(); // Internal function variables
    this.pendingExports = new Map(); // Variables to export to shell
  }

  /**
   * Capture current shell context from command execution
   */
  public abstract captureShellContext(command: string, workingDirectory: string): Promise<Map<string, any>>;

  /**
   * Extract variables from shell error context
   */
  public abstract extractContextFromError(command: string, stderr: string): Map<string, any>;

  /**
   * Synchronize shell context to internal functions
   * Makes shell variables available to internal functions
   */
  public syncToInternal(): void {
    // Merge shell context into shared state
    for (const [key, value] of this.shellContext) {
      this.sharedState.set(key, value);
      this.internalContext.set(key, value);
    }
  }

  /**
   * Synchronize internal context back to shell
   * Makes internal function variables available to shell
   */
  public syncToShell(): void {
    // Mark new/modified variables for shell export
    for (const [key, value] of this.internalContext) {
      if (!this.shellContext.has(key) || this.shellContext.get(key) !== value) {
        this.pendingExports.set(key, value);
        this.sharedState.set(key, value);
      }
    }
  }

  /**
   * Generate shell commands to export variables
   */
  public abstract generateExportCommands(): string;

  /**
   * Get variable value (checks all contexts)
   */
  public getVariable(name: string): any {
    // Priority: internal context > shared state > shell context
    return this.internalContext.get(name) || 
           this.sharedState.get(name) || 
           this.shellContext.get(name);
  }

  /**
   * Set variable value in internal context
   */
  public setVariable(name: string, value: any): void {
    this.internalContext.set(name, value);
    this.sharedState.set(name, value);
  }

  /**
   * Get all available variables for internal functions
   */
  public getInternalVariables(): Map<string, any> {
    const allVariables = new Map<string, any>();
    
    // Merge in priority order
    for (const [key, value] of this.shellContext) {
      allVariables.set(key, value);
    }
    for (const [key, value] of this.sharedState) {
      allVariables.set(key, value);
    }
    for (const [key, value] of this.internalContext) {
      allVariables.set(key, value);
    }
    
    return allVariables;
  }

  /**
   * Clear all contexts (useful for testing)
   */
  public clearAll(): void {
    this.sharedState.clear();
    this.shellContext.clear();
    this.internalContext.clear();
    this.pendingExports.clear();
  }

  /**
   * Get pending exports for shell
   */
  public getPendingExports(): Map<string, any> {
    return this.pendingExports;
  }

  /**
   * Debug info for troubleshooting
   */
  public getDebugInfo(): StateDebugInfo {
    return {
      sharedState: Object.fromEntries(this.sharedState),
      shellContext: Object.fromEntries(this.shellContext),
      internalContext: Object.fromEntries(this.internalContext),
      pendingExports: Object.fromEntries(this.pendingExports)
    };
  }
}