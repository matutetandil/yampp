/**
 * Yampp Plugin Types - SOLID Compliant
 *
 * Each interface follows SOLID principles:
 * - Single Responsibility: One purpose per interface
 * - Open/Closed: Open for extension, closed for modification
 * - Liskov Substitution: Implementations can be substituted
 * - Interface Segregation: Small, focused interfaces
 * - Dependency Inversion: Depend on abstractions, not concretions
 */

// Core plugin interfaces
export type { IPlugin } from './core/IPlugin.js';
export type { IInitializablePlugin } from './core/IInitializablePlugin.js';

// Plugin capabilities (Interface Segregation)
export type { IFunctionProvider } from './capabilities/IFunctionProvider.js';
export type { IRuntimeProvider } from './capabilities/IRuntimeProvider.js';
export type { IModifierProvider } from './capabilities/IModifierProvider.js';
export type { ICommandProvider } from './capabilities/ICommandProvider.js';
export type { ITaskLifecycleHooks } from './capabilities/ITaskLifecycleHooks.js';

// Abstractions (Dependency Inversion)
export type { IInternalFunction } from './abstractions/IInternalFunction.js';
export type { IRuntime } from './abstractions/IRuntime.js';
export type { IModifier } from './abstractions/IModifier.js';
export type { ICommand } from './abstractions/ICommand.js';
export type { ILogger } from './abstractions/ILogger.js';
export type { IFileSystem } from './abstractions/IFileSystem.js';
export type { IShellExecutor } from './abstractions/IShellExecutor.js';
export type { IConfigurationManager } from './abstractions/IConfigurationManager.js';

// Data Transfer Objects
export type { IPluginContext } from './dto/IPluginContext.js';
export type { IExecutionContext } from './dto/IExecutionContext.js';
export type { ITaskInfo } from './dto/ITaskInfo.js';
export type { ITaskResult } from './dto/ITaskResult.js';
export type { IExecutionResult } from './dto/IExecutionResult.js';
export type { ICommandOption } from './dto/ICommandOption.js';
export type { IShellOptions } from './dto/IShellOptions.js';
export type { IShellResult } from './dto/IShellResult.js';
export type { IPluginConfig } from './dto/IPluginConfig.js';

// Factories
export type { IPluginFactory } from './factories/IPluginFactory.js';

// Import for type aliases
import type { IPlugin } from './core/IPlugin.js';
import type { IInitializablePlugin } from './core/IInitializablePlugin.js';
import type { IFunctionProvider } from './capabilities/IFunctionProvider.js';
import type { IRuntimeProvider } from './capabilities/IRuntimeProvider.js';
import type { IModifierProvider } from './capabilities/IModifierProvider.js';
import type { ICommandProvider } from './capabilities/ICommandProvider.js';
import type { ITaskLifecycleHooks } from './capabilities/ITaskLifecycleHooks.js';

// Convenience type aliases for common plugin patterns
export type YamppPlugin = IInitializablePlugin
  & Partial<IFunctionProvider>
  & Partial<IRuntimeProvider>
  & Partial<IModifierProvider>
  & Partial<ICommandProvider>
  & Partial<ITaskLifecycleHooks>;

export type FunctionPlugin = IPlugin & IFunctionProvider;
export type RuntimePlugin = IPlugin & IRuntimeProvider;
export type CommandPlugin = IPlugin & ICommandProvider;
export type ModifierPlugin = IPlugin & IModifierProvider;