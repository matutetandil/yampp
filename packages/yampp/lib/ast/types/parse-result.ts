import type { Task } from '../../models/';

export interface ParseResult {
  tasks: Map<string, Task>;
  globalVariables: Map<string, any>;
  globalConstants: Map<string, any>;
  globalEnvironmentVariables: Map<string, any>;
}