/**
 * Parser type definitions
 * Following Single Responsibility Principle - each type has its own file
 */

export { IncludeContext } from './include-context.js';
export { ResolvedInclude } from './resolved-include.js';
export { MergeContext } from './merge-context.js';
export { ConflictInfo } from './conflict-info.js';

/**
 * Centralized exports for easier imports:
 * 
 * Before:
 * import type { IncludeContext } from './parser/include-resolver.js';
 * import type { MergeContext } from './parser/smart-merger.js';
 * 
 * After:
 * import type { IncludeContext, MergeContext } from './parser/types/index.js';
 */