import { InputFunction } from './input-function.js';
import { InputPasswordFunction } from './input-password-function.js';
import { InputSelectFunction } from './input-select-function.js';
import { InputConfirmFunction } from './input-confirm-function.js';
import { CallFunction } from './call-function.js';

/**
 * Registry for internal functions
 * Manages all internal function strategies and provides a clean API
 */
export class InternalFunctionRegistry {
  constructor(runner) {
    this.runner = runner;
    this.functions = new Map();
    this.registerBuiltInFunctions();
  }

  /**
   * Register all built-in internal functions
   */
  registerBuiltInFunctions() {
    this.register('input', new InputFunction(this.runner));
    this.register('input_password', new InputPasswordFunction(this.runner));
    this.register('input_select', new InputSelectFunction(this.runner));
    this.register('input_confirm', new InputConfirmFunction(this.runner));
    this.register('call', new CallFunction(this.runner));
  }

  /**
   * Register a new internal function
   * @param {string} name - Function name (without __ prefix)
   * @param {BaseInternalFunction} handler - Handler instance
   */
  register(name, handler) {
    this.functions.set(name, handler);
  }

  /**
   * Execute an internal function
   * @param {Object} func - Function object from parser
   * @param {Map} variables - Current task variables
   * @param {string} signature - Task signature
   * @param {Map} taskPromises - Task promises
   * @param {Object} limit - Concurrency limit
   * @param {Object} serialLimit - Serial limit
   * @returns {Promise<any>} - Function result
   */
  async execute(func, variables, signature, taskPromises, limit, serialLimit) {
    const handler = this.functions.get(func.name);
    
    if (!handler) {
      if (!this.runner.quiet) {
        console.warn(`Warning: Unknown internal function __${func.name}`);
      }
      return null;
    }

    return await handler.execute(func, variables, signature, taskPromises, limit, serialLimit);
  }

  /**
   * Check if a function is registered
   * @param {string} name - Function name (without __ prefix)
   * @returns {boolean}
   */
  has(name) {
    return this.functions.has(name);
  }

  /**
   * Get all registered function names
   * @returns {string[]}
   */
  getFunctionNames() {
    return Array.from(this.functions.keys());
  }
}