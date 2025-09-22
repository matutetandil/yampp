import { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/internal-function-registry.js';
import { ShellProxyManager } from '../shell-proxy/shell-proxy-manager.js';
import { PlatformInfo } from './interfaces/platform-info.interface.js';
import { ShellCommand } from '../shell/interfaces/shell-command.interface.js';
import type { ParsedParameter } from '../core/types/parsed-parameter.js';

/**
 * Abstract base class for platform detection strategies
 * Provides the contract that all platform-specific implementations must follow
 */
export abstract class PlatformStrategy {
  public readonly name: string;
  public readonly aliases: string[];
  private _stateManager?: SharedStateManager;
  private _shellProxyManager?: ShellProxyManager;

  constructor(name: string, aliases: string[] = []) {
    if (new.target === PlatformStrategy) {
      throw new Error('PlatformStrategy is abstract and cannot be instantiated directly');
    }
    
    this.name = name;
    this.aliases = aliases;
  }

  /**
   * Check if this strategy applies to current environment
   */
  public abstract isCurrentPlatform(): boolean;

  /**
   * Check if given platform name matches this strategy
   */
  public matches(platformName: string): boolean {
    // Check exact name match
    if (platformName === this.name) {
      return true;
    }

    // Check aliases
    return this.aliases.includes(platformName);
  }

  /**
   * Get platform-specific information (optional override)
   */
  public getPlatformInfo(): PlatformInfo {
    return {
      name: this.name,
      aliases: this.aliases
    };
  }

  /**
   * Prepare shell command with platform-specific strict mode
   */
  public abstract prepareShellCommand(command: string): ShellCommand;

  /**
   * Detect internal functions in shell error output
   */
  public detectInternalFunction(stderr: string): string | null {
    // Generic detection that works for most shells
    const internalFunctionRegex = /__([a-zA-Z_][a-zA-Z0-9_]*)/;
    const match = stderr.match(internalFunctionRegex);
    return match ? (match[1] || null) : null;
  }

  /**
   * Parse internal function parameters with platform-specific escaping
   */
  public parseInternalFunctionParams(paramString: string): ParsedParameter[] {
    if (!paramString) return [];
    
    const params: ParsedParameter[] = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    
    while ((match = regex.exec(paramString)) !== null) {
      if (match[1] !== undefined) {
        // Double quoted string - check if it contains task_name(params) pattern
        const taskCallMatch = match[1]?.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch && taskCallMatch[1] && taskCallMatch[2]) {
          // It's a task call: "task_name(param1, param2)"
          params.push({ type: 'identifier', value: taskCallMatch[1] }); // Task name
          // Parse parameters and wrap them in params object
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          // Regular string
          params.push({ type: 'string', value: match[1] || '' });
        }
      } else if (match[2] !== undefined) {
        // Single quoted string - similar logic
        const taskCallMatch = match[2]?.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch && taskCallMatch[1] && taskCallMatch[2]) {
          params.push({ type: 'identifier', value: taskCallMatch[1] });
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          params.push({ type: 'string', value: match[2] || '' });
        }
      } else if (match[3]?.startsWith('$')) {
        // Variable reference
        params.push({ type: 'variable', name: match[3].substring(1) });
      } else {
        // Check for unquoted task_name(params) pattern
        const taskCallMatch = match[3]?.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
        if (taskCallMatch && taskCallMatch[1] && taskCallMatch[2]) {
          params.push({ type: 'identifier', value: taskCallMatch[1] });
          const taskParams = this.parseInternalFunctionParams(taskCallMatch[2]);
          params.push({ type: 'params', value: taskParams });
        } else {
          // Regular identifier or literal
          params.push({ type: 'identifier', value: match[3] || '' });
        }
      }
    }
    
    return params;
  }

  /**
   * Create platform-specific state manager (lazy initialization)
   */
  public abstract createStateManager(): SharedStateManager;

  /**
   * Get or create state manager singleton for this strategy
   */
  public getStateManager(): SharedStateManager {
    if (!this._stateManager) {
      this._stateManager = this.createStateManager();
    }
    return this._stateManager;
  }

  /**
   * Create shell proxy manager (requires injection)
   */
  public abstract createShellProxyManager(registry: InternalFunctionRegistry): ShellProxyManager;

  /**
   * Get or create shell proxy manager singleton
   */
  public getShellProxyManager(registry: InternalFunctionRegistry): ShellProxyManager {
    if (!this._shellProxyManager) {
      this._shellProxyManager = this.createShellProxyManager(registry);
    }
    return this._shellProxyManager;
  }

  /**
   * Resolve parameter variables to their actual values
   */
  public resolveParameterVariables(params: ParsedParameter[], stateManager: SharedStateManager): ParsedParameter[] {
    const resolvedParams: ParsedParameter[] = [];

    for (const param of params) {
      if (param.type === 'variable') {
        // Resolve variable to its actual value
        const value = stateManager.getVariable(param.name!);
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