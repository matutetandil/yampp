/**
 * Information about merge conflicts
 * Used for detailed conflict reporting with file and location context
 */
export interface ConflictInfo {
  type: 'task' | 'variable' | 'constant' | 'default_profile';
  name: string;
  mainFile: string;
  conflictFile: string;
  mainLocation?: any;
  conflictLocation?: any;
}