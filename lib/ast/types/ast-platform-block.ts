import { AstTask } from './ast-task.js';

/**
 * AST node representing a platform-specific block
 */
export interface AstPlatformBlock {
  platforms: string[];
  tasks: AstTask[];
}