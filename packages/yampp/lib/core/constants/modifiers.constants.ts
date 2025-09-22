/**
 * Task modifier constants
 * Centralized definition of all task modifiers to avoid magic strings
 */
export const TaskModifiers = {
  /** Always execute task, ignoring cache */
  ALWAYS: 'always',
  
  /** Execute task serially, not in parallel */
  SERIAL: 'serial',
  
  /** Critical task - if it fails, stop all execution */
  CRITICAL: 'critical'
} as const;