import type { Task } from '../../models/';
import type { AstNode } from './ast-node.js';

export interface ParseResult {
  tasks: Map<string, Task>;
  globalVariables: Map<string, any>;
  globalConstants: Map<string, any>;
  globalEnvironmentVariables: Map<string, any>;
  ast: AstNode;
}