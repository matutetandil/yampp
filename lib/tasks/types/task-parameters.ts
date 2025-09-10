/**
 * Task parameter types
 */
export interface TaskParameter {
  /** Parameter type */
  type: 'variable' | 'identifier' | 'string';
  
  /** Parameter name (for variable type) */
  name?: string;
  
  /** Parameter value (for other types) */
  value?: string;
}