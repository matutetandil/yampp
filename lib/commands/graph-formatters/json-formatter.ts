import { BaseGraphFormatter } from './base-formatter.js';

/**
 * JSON formatter for graph output
 * Generates structured JSON for programmatic consumption
 */
export class JsonGraphFormatter extends BaseGraphFormatter {
  public getName(): string {
    return 'json';
  }
  
  public supportsTaskFilter(): boolean {
    return false; // JSON format shows entire graph structure
  }
  
  public override format(taskName?: string): void {
    // JSON format always shows the complete graph structure
    // taskName parameter is ignored for consistency
    console.log(JSON.stringify(this.graph.toJSON(), null, 2));
  }
}