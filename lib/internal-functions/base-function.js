/**
 * Base class for all internal functions
 * Defines the interface that all internal function strategies must implement
 */
export class BaseInternalFunction {
  constructor(runner) {
    this.runner = runner;
    this.inputManager = runner.inputManager;
  }

  /**
   * Execute the internal function
   * @param {Object} func - The function object from the parser
   * @param {Map} variables - Current task variables
   * @param {string} signature - Task signature for logging
   * @param {Map} taskPromises - Task promises for __call
   * @param {Object} limit - Concurrency limit
   * @param {Object} serialLimit - Serial execution limit
   * @returns {Promise<any>} - Result of the function execution
   */
  async execute(func, variables, signature, taskPromises, limit, serialLimit) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Parse a parameter value, handling different types
   * @param {any} param - Parameter to parse
   * @param {Map} variables - Current variables for substitution
   * @returns {any} - Parsed parameter value
   */
  parseParameter(param, variables) {
    if (typeof param === 'string') {
      return param;
    }
    
    if (param.type === 'string') {
      return param.value;
    }
    
    if (param.type === 'array') {
      return param.value;
    }
    
    if (param.type === 'variable') {
      const value = variables.get(param.name);
      return value !== undefined ? value : `$${param.name}`;
    }
    
    if (param.type === 'identifier') {
      return param.value;
    }
    
    return String(param);
  }
}