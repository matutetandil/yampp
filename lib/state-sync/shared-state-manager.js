/**
 * Abstract base class for shared state management between shell and internal functions
 * Provides bidirectional synchronization of variables and context
 */
export class SharedStateManager {
  constructor(platformStrategy) {
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
   * @param {string} command - The command being executed
   * @param {string} workingDirectory - Current working directory
   * @returns {Promise<Map>} - Captured shell variables
   */
  async captureShellContext(command, workingDirectory) {
    throw new Error('captureShellContext() must be implemented by subclasses');
  }

  /**
   * Extract variables from shell error context
   * @param {string} command - Original command
   * @param {string} stderr - Shell error output
   * @returns {Map} - Variables available at error point
   */
  extractContextFromError(command, stderr) {
    throw new Error('extractContextFromError() must be implemented by subclasses');
  }

  /**
   * Synchronize shell context to internal functions
   * Makes shell variables available to internal functions
   */
  syncToInternal() {
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
  syncToShell() {
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
   * @returns {string} - Shell commands to set variables
   */
  generateExportCommands() {
    throw new Error('generateExportCommands() must be implemented by subclasses');
  }

  /**
   * Get variable value (checks all contexts)
   * @param {string} name - Variable name
   * @returns {*} - Variable value or undefined
   */
  getVariable(name) {
    // Priority: internal context > shared state > shell context
    return this.internalContext.get(name) || 
           this.sharedState.get(name) || 
           this.shellContext.get(name);
  }

  /**
   * Set variable value in internal context
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   */
  setVariable(name, value) {
    this.internalContext.set(name, value);
    this.sharedState.set(name, value);
  }

  /**
   * Get all available variables for internal functions
   * @returns {Map} - All variables accessible to internal functions
   */
  getInternalVariables() {
    const allVariables = new Map();
    
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
  clearAll() {
    this.sharedState.clear();
    this.shellContext.clear();
    this.internalContext.clear();
    this.pendingExports.clear();
  }

  /**
   * Debug info for troubleshooting
   * @returns {Object} - Current state information
   */
  getDebugInfo() {
    return {
      sharedState: Object.fromEntries(this.sharedState),
      shellContext: Object.fromEntries(this.shellContext),
      internalContext: Object.fromEntries(this.internalContext),
      pendingExports: Object.fromEntries(this.pendingExports)
    };
  }
}