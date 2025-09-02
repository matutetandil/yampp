/**
 * Command Registry implementing Factory + Registry patterns
 * Manages CLI command registration and execution
 */
export class CommandRegistry {
  constructor() {
    this.commands = new Map();
  }
  
  /**
   * Register a command class
   * @param {string} name - Command name
   * @param {class} commandClass - Command class extending BaseCommand
   */
  register(name, commandClass) {
    this.commands.set(name, commandClass);
  }
  
  /**
   * Execute a registered command
   * @param {string} commandName - Name of command to execute
   * @param {Runner} runner - Runner instance for context
   * @param {any} args - Command arguments
   * @param {Object} options - Command options
   * @returns {Promise<Object>} Command execution result
   */
  async execute(commandName, runner, args, options = {}) {
    const CommandClass = this.commands.get(commandName);
    if (!CommandClass) {
      throw new Error(`Command '${commandName}' not found. Available commands: ${Array.from(this.commands.keys()).join(', ')}`);
    }
    
    const command = new CommandClass(runner, options);
    return await command.execute(args);
  }
  
  /**
   * Get all registered command names
   * @returns {string[]} Array of command names
   */
  getAvailableCommands() {
    return Array.from(this.commands.keys());
  }
  
  /**
   * Get description for a command
   * @param {string} commandName - Command name
   * @returns {string} Command description
   */
  getCommandDescription(commandName) {
    const CommandClass = this.commands.get(commandName);
    if (!CommandClass) {
      return null;
    }
    
    // Create temporary instance to get description
    const tempInstance = new CommandClass(null);
    return tempInstance.getDescription();
  }
  
  /**
   * Check if a command is registered
   * @param {string} commandName - Command name to check
   * @returns {boolean} True if command exists
   */
  hasCommand(commandName) {
    return this.commands.has(commandName);
  }
}