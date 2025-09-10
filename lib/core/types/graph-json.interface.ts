import { GraphNode } from './graph-node.interface.js';
import { GraphEdge } from './graph-edge.interface.js';

export interface GraphJSON {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalTasks: number;
  generatedAt: string;
}