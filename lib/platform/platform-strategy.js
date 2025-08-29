/**
 * Abstract base class for platform detection strategies
 * Provides the contract that all platform-specific implementations must follow
 */
export class PlatformStrategy {
  constructor(name, aliases = []) {
    if (new.target === PlatformStrategy) {
      throw new Error('PlatformStrategy is abstract and cannot be instantiated directly');
    }
    
    this.name = name;
    this.aliases = aliases;
  }

  /**
   * Check if this strategy applies to current environment
   * @returns {boolean}
   */
  isCurrentPlatform() {
    throw new Error('isCurrentPlatform() must be implemented by subclasses');
  }

  /**
   * Check if given platform name matches this strategy
   * @param {string} platformName - Platform name to match
   * @returns {boolean}
   */
  matches(platformName) {
    // Check exact name match
    if (platformName === this.name) {
      return true;
    }

    // Check aliases
    return this.aliases.includes(platformName);
  }

  /**
   * Get platform-specific information (optional override)
   * @returns {Object}
   */
  getPlatformInfo() {
    return {
      name: this.name,
      aliases: this.aliases
    };
  }

  /**
   * Prepare shell command with platform-specific strict mode
   * @param {string} command - Raw command to execute
   * @returns {Object} - { shell, args, processedCommand }
   */
  prepareShellCommand(command) {
    throw new Error('prepareShellCommand() must be implemented by subclasses');
  }

  /**
   * Detect internal functions in shell error output
   * @param {string} stderr - Shell error output
   * @returns {string|null} - Internal function name if found, null otherwise
   */
  detectInternalFunction(stderr) {
    // Generic detection that works for most shells
    const internalFunctionRegex = /__([a-zA-Z_][a-zA-Z0-9_]*)/;
    const match = stderr.match(internalFunctionRegex);
    return match ? match[1] : null;
  }

  /**
   * Parse internal function parameters with platform-specific escaping
   * @param {string} paramString - Parameter string to parse
   * @returns {Array} - Parsed parameters
   */
  parseInternalFunctionParams(paramString) {
    if (!paramString) return [];
    
    const params = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    
    while ((match = regex.exec(paramString)) !== null) {
      if (match[1] !== undefined) {
        // Double quoted string - check if it contains task_name(params) pattern
        const taskCallMatch = match[1].match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch) {
          // It's a task call: "task_name(param1, param2)"
          params.push({ type: 'identifier', value: taskCallMatch[1] }); // Task name
          // Parse parameters and wrap them in params object
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          // Regular string
          params.push({ type: 'string', value: match[1] });
        }
      } else if (match[2] !== undefined) {
        // Single quoted string - similar logic
        const taskCallMatch = match[2].match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch) {
          params.push({ type: 'identifier', value: taskCallMatch[1] });
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          params.push({ type: 'string', value: match[2] });
        }
      } else if (match[3].startsWith('$')) {
        // Variable reference
        params.push({ type: 'variable', name: match[3].substring(1) });
      } else {
        // Check for unquoted task_name(params) pattern
        const taskCallMatch = match[3].match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch) {
          params.push({ type: 'identifier', value: taskCallMatch[1] });
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          // Regular identifier or literal
          params.push({ type: 'identifier', value: match[3] });
        }
      }
    }
    
    return params;
  }

  /**
   * Create platform-specific state manager (lazy initialization)
   * @returns {SharedStateManager} - State manager instance
   */
  createStateManager() {
    throw new Error('createStateManager() must be implemented by subclasses');
  }

  /**
   * Get or create state manager singleton for this strategy
   * @returns {SharedStateManager} - State manager instance
   */
  getStateManager() {
    if (!this._stateManager) {
      this._stateManager = this.createStateManager();
    }
    return this._stateManager;
  }

  /**
   * Create shell proxy manager (requires injection)
   * @param {InternalFunctionRegistry} registry - Function registry
   * @returns {ShellProxyManager} - Proxy manager instance
   */
  createShellProxyManager(registry) {
    throw new Error('createShellProxyManager() must be implemented by subclasses');
  }

  /**
   * Get or create shell proxy manager singleton
   * @param {InternalFunctionRegistry} registry - Function registry
   * @returns {ShellProxyManager} - Proxy manager instance
   */
  getShellProxyManager(registry) {
    if (!this._shellProxyManager) {
      this._shellProxyManager = this.createShellProxyManager(registry);
    }
    return this._shellProxyManager;
  }

  /**
   * Resolve parameter variables to their actual values
   * @param {Array} params - Parsed parameters with types
   * @param {SharedStateManager} stateManager - State manager with variable context
   * @returns {Array} - Resolved parameters ready for internal function execution
   */
  resolveParameterVariables(params, stateManager) {
    const resolvedParams = [];

    for (const param of params) {
      if (param.type === 'variable') {
        // Resolve variable to its actual value
        const value = stateManager.getVariable(param.name);
        if (value !== undefined) {
          resolvedParams.push({ type: 'identifier', value: String(value) });
        } else {
          // Variable not found, keep as-is (might be undefined behavior)
          resolvedParams.push({ type: 'identifier', value: `$${param.name}` });
        }
      } else if (param.type === 'params') {
        // Recursively resolve variables within parameter lists
        const resolvedSubParams = this.resolveParameterVariables(param.value, stateManager);
        resolvedParams.push({ type: 'params', value: resolvedSubParams });
      } else {
        // Non-variable parameters pass through unchanged
        resolvedParams.push(param);
      }
    }

    return resolvedParams;
  }
}