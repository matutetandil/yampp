// Hook Types
export type { HookType } from './types/hook-type.js';

// Hook Interfaces (useful for extensions)
export type { IHookContext } from './interfaces/hook-context.interface.js';
export type { IHookDefinition } from './interfaces/hook-definition.interface.js';
export type { IHookExecutionResult } from './interfaces/hook-execution-result.interface.js';
export type { IHookExecutor } from './interfaces/hook-executor.interface.js';
export type { IHookRegistry } from './interfaces/hook-registry.interface.js';
export type { IHookManager } from './interfaces/hook-manager.interface.js';

// Simple Hook System
export { HookDetector } from './simple/hook-detector.js';
export { HookValidator } from './simple/hook-validator.js';

// Hook Lifecycle Integration Interface (useful for future complex hooks)
export type { ITaskLifecycleHooks } from './integrations/task-lifecycle-hooks.interface.js';