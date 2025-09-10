import { BaseCommand } from './base-command.js';
import { CommandResult } from '../core/types/command-result.interface.js';
import { CommandOptions } from '../core/types/command-options.interface.js';
import { Runner } from '../runner.js';

type CommandConstructor = new (runner: Runner, options?: CommandOptions) => BaseCommand;

/**
 * Command Registry implementing Factory + Registry patterns
 * Manages CLI command registration and execution
 */
export class CommandRegistry {
  private readonly commands: Map<string, CommandConstructor>;

  constructor() {
    this.commands = new Map();
  }
  
  /**
   * Register a command class
   */
  public register(name: string, commandClass: CommandConstructor): void {
    this.commands.set(name, commandClass);
  }
  
  /**
   * Execute a registered command
   */
  public async execute(commandName: string, runner: Runner, args?: any, options: CommandOptions = {}): Promise<CommandResult> {
    const CommandClass = this.commands.get(commandName);
    if (!CommandClass) {
      throw new Error(`Command '${commandName}' not found. Available commands: ${Array.from(this.commands.keys()).join(', ')}`);
    }
    
    const command = new CommandClass(runner, options);
    return await command.execute(args);
  }
  
  /**
   * Get all registered command names
   */
  public getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
  
  /**
   * Get description for a command
   */
  public getCommandDescription(commandName: string): string | null {
    const CommandClass = this.commands.get(commandName);
    if (!CommandClass) {
      return null;
    }
    
    // Create temporary instance to get description
    const tempInstance = new CommandClass(null as any);
    return tempInstance.getDescription();
  }
  
  /**
   * Check if a command is registered
   */
  public hasCommand(commandName: string): boolean {
    return this.commands.has(commandName);
  }
}