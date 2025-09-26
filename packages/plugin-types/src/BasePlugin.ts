/**
 * BasePlugin - Abstract base class for all Yampp plugins
 * Single Responsibility: Define the contract and base behavior for plugins
 */

import type { IInitializablePlugin } from './core/IInitializablePlugin.js';
import type { IFunctionProvider } from './capabilities/IFunctionProvider.js';
import type { ICommandProvider } from './capabilities/ICommandProvider.js';
import type { IModifierProvider } from './capabilities/IModifierProvider.js';
import type { IPluginContext } from './dto/IPluginContext.js';
import { BaseFunction } from './functions/BaseFunction.js';

export abstract class BasePlugin implements IInitializablePlugin, IFunctionProvider, ICommandProvider, IModifierProvider {
  // Protected properties with proper encapsulation
  protected readonly _name: string;
  protected readonly _version: string;
  protected readonly _description: string;

  constructor(name: string, version: string, description: string) {
    this._name = name;
    this._version = version;
    this._description = description;
  }

  // Getters for proper encapsulation
  get name(): string {
    return this._name;
  }

  get version(): string {
    return this._version;
  }

  get description(): string {
    return this._description;
  }

  // Abstract method - subclasses must implement initialization
  abstract initialize(context: IPluginContext): Promise<void>;

  // Abstract method - subclasses must provide their functions
  abstract getFunctions(): Record<string, BaseFunction>;

  // Virtual methods - subclasses can override if needed
  getCommands(): Record<string, any> {
    return {};
  }

  getModifiers(): Record<string, any> {
    return {};
  }
}