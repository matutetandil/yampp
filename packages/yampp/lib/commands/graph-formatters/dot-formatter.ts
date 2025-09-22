import { BaseGraphFormatter } from './base-formatter.js';

/**
 * DOT formatter for graph output
 * Generates Graphviz DOT format for visualization tools
 */
export class DotGraphFormatter extends BaseGraphFormatter {
  public getName(): string {
    return 'dot';
  }
  
  public supportsTaskFilter(): boolean {
    return false; // DOT format shows entire graph
  }
  
  public override format(taskName?: string): void {
    // DOT format always shows the complete graph
    // taskName parameter is ignored
    console.log(this.graph.toDotFormat());
  }
}