import { IModifierRegistry } from './interfaces/modifier-registry.interface.js';
import { TaskModifiers } from '../core/constants/modifiers.constants.js';

export class ModifierRegistry implements IModifierRegistry {
  private readonly modifiers = new Map<string, string | undefined>();

  constructor() {
    // Register default modifiers
    this.registerDefaultModifiers();
  }

  public registerModifier(name: string, description?: string): void {
    this.modifiers.set(name, description);
  }

  public isValidModifier(name: string): boolean {
    return this.modifiers.has(name);
  }

  public getRegisteredModifiers(): string[] {
    return Array.from(this.modifiers.keys());
  }

  public getModifierDescription(name: string): string | undefined {
    return this.modifiers.get(name);
  }

  public clearModifiers(): void {
    this.modifiers.clear();
  }

  private registerDefaultModifiers(): void {
    this.registerModifier(TaskModifiers.ALWAYS, 'Always execute this task, ignoring cache');
    this.registerModifier(TaskModifiers.SERIAL, 'Execute this task serially, not in parallel');
    this.registerModifier(TaskModifiers.CRITICAL, 'If this task fails, stop all execution');
  }
}