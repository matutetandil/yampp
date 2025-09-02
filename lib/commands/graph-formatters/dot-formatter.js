import { BaseGraphFormatter } from './base-formatter.js';

/**
 * DOT formatter for graph output
 * Generates Graphviz DOT format for visualization tools
 */
export class DotGraphFormatter extends BaseGraphFormatter {
  getName() {
    return 'dot';
  }
  
  supportsTaskFilter() {
    return false; // DOT format shows entire graph
  }
  
  format(taskName) {
    // DOT format always shows the complete graph
    // taskName parameter is ignored
    console.log(this.graph.toDotFormat());
  }
}