/**
 * Supported hook types
 * Follows OCP - new hook types can be added without modifying existing code
 */
export type HookType = 'before' | 'after' | 'finally' | 'before_all' | 'after_all';