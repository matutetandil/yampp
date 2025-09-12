import { AstParameter } from './ast-parameter.js';
import { AstCommand } from './ast-command.js';
import { AstInternalFunction } from './ast-internal-function.js';

/**
 * AST node representing a task definition
 */
export interface AstTask {
  type: 'task';
  name: string;
  parameters: AstParameter[];
  dependencies: string[];
  dependencyParams: Record<string, AstParameter[]>;
  modifiers: string[];
  commands: AstCommand[];
  internalFunctions: AstInternalFunction[];
  watches: string[];
  location?: any;
}