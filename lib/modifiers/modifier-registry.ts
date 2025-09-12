import { IModifierRegistry } from './interfaces/modifier-registry.interface.js';

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
    this.registerModifier('always', 'Always execute this task, ignoring cache');
    this.registerModifier('serial', 'Execute this task serially, not in parallel');
    this.registerModifier('critical', 'If this task fails, stop all execution');
  }
}