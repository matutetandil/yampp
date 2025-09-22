import type { ParameterNode } from './parameter-node.js';

export interface InternalFunctionNode {
  name: string;
  params?: ParameterNode[];
}