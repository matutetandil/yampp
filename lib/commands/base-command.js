/**
 * Abstract base class for all CLI commands
 * Implements Strategy pattern for command execution
 */
export class BaseCommand {
  constructor(runner, options = {}) {
    this.runner = runner;
    this.options = options;
  }
  
  /**
   * Execute the command with given arguments
   * @param {any} args - Command-specific arguments
   * @returns {Promise<Object>} Result object with success status
   */
  async execute(args) {
    throw new Error(`execute() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Get human-readable description of this command
   * @returns {string} Description text
   */
  getDescription() {
    throw new Error(`getDescription() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Get command name for registry
   * @returns {string} Command name
   */
  getName() {
    return this.constructor.name.toLowerCase().replace('command', '');
  }
}