import type { CallNode } from './call-node.js';
import type { InputNode } from './input-node.js';
import type { InternalFunctionNode } from './internal-function-node.js';

export interface TaskAstNode {
  name: string;
  localVariables?: Array<{ name: string; value: any }>;
  localConstants?: Array<{ name: string; value: any }>;
  localEnvironmentVariables?: Array<{ name: string }>;
  dependencies?: string[];
  dependencyParams?: Record<string, any[]>;
  calls?: CallNode[];
  internalFunctions?: InternalFunctionNode[];
  inputs?: InputNode[];
  commands?: string[];
  modifiers?: string[];
  parameters?: any[];
  watchedFiles?: string[];
  location?: {
    start?: {
      line?: number;
    };
  };
}