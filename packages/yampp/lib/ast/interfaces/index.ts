/**
 * Segregated AST Task Adapter Interfaces
 * Following Interface Segregation Principle - clients depend only on what they need
 */

// Individual segregated interfaces
export { IAstTaskBasicInfo } from './ast-task-basic-info.interface.js';
export { IAstTaskDependencies } from './ast-task-dependencies.interface.js';
export { IAstTaskContent } from './ast-task-content.interface.js';
export { IAstTaskVariables } from './ast-task-variables.interface.js';
export { IAstTaskFiles } from './ast-task-files.interface.js';
export { IAstTaskExtensibility } from './ast-task-extensibility.interface.js';

// Complete composed interface (for backward compatibility)
export { IAstTaskAdapter } from './ast-task-adapter.interface.js';

/**
 * Usage Examples:
 * 
 * // For clients that only need basic info
 * function processTaskName(taskInfo: IAstTaskBasicInfo) {
 *   return taskInfo.getName().toUpperCase();
 * }
 * 
 * // For clients that only need dependencies
 * function buildDependencyGraph(taskDeps: IAstTaskDependencies) {
 *   return taskDeps.getDependencies().map(dep => ({ name: dep }));
 * }
 * 
 * // For clients that need everything (like Parser)
 * function convertToInternalFormat(adapter: IAstTaskAdapter) {
 *   // Uses all methods
 * }
 */