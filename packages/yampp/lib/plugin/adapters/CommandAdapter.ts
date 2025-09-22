import type { YamppPlugin, ICommandProvider, ICommand } from '@yampp/plugin-types';
import { BaseCommand } from '../../commands/base-command.js';
import type { CommandResult } from '../../core/types/command-result.interface.js';
import type { CommandOptions } from '../../core/types/command-options.interface.js';
import type { Runner } from '../../runner.js';

/**
 * Adapter to integrate YamppPlugin commands with existing CommandRegistry
 * Single Responsibility: Bridge between new plugin commands and existing command registry
 */
export class CommandAdapter {
  constructor(private yamppPlugin: YamppPlugin & ICommandProvider) {}

  /**
   * Create command classes that can be registered with CommandRegistry
   */
  createCommandClasses(): Map<string, new (runner: Runner, options?: CommandOptions) => BaseCommand> {
    const commands = this.yamppPlugin.getCommands();
    const commandClasses = new Map();

    for (const [name, command] of Object.entries(commands)) {
      const CommandClass = this.createCommandClass(name, command);
      commandClasses.set(name, CommandClass);
    }

    return commandClasses;
  }

  private createCommandClass(commandName: string, pluginCommand: ICommand) {
    const plugin = this.yamppPlugin;

    return class extends BaseCommand {
      constructor(runner: Runner, options: CommandOptions = {}) {
        super(runner, options);
      }

      getName(): string {
        return commandName;
      }

      getDescription(): string {
        return pluginCommand.description || '';
      }

      async execute(args: string[] = [], options: Record<string, any> = {}): Promise<CommandResult> {
        try {
          await pluginCommand.execute(args, options);

          return {
            success: true,
            message: `Command '${commandName}' from plugin '${plugin.name}' executed successfully`
          };
        } catch (error) {
          return {
            success: false,
            message: `Command '${commandName}' from plugin '${plugin.name}' failed: ${error}`,
            error: (error as Error).message
          };
        }
      }
    };
  }
}