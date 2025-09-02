/**
 * Abstract base class for graph formatters
 * Implements Strategy pattern for different output formats
 */
export class BaseGraphFormatter {
  constructor(runner) {
    this.runner = runner;
    this.graph = runner.graph;
    this.tasks = runner.tasks;
  }
  
  /**
   * Format and output the graph
   * @param {string} taskName - Optional specific task to show
   * @returns {void}
   */
  format(taskName) {
    throw new Error(`format() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Get formatter name
   * @returns {string} Formatter name
   */
  getName() {
    throw new Error(`getName() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Check if this formatter supports a specific task filter
   * @returns {boolean}
   */
  supportsTaskFilter() {
    return true;
  }
}