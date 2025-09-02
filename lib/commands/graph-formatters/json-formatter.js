import { BaseGraphFormatter } from './base-formatter.js';

/**
 * JSON formatter for graph output
 * Generates structured JSON for programmatic consumption
 */
export class JsonGraphFormatter extends BaseGraphFormatter {
  getName() {
    return 'json';
  }
  
  supportsTaskFilter() {
    return false; // JSON format shows entire graph structure
  }
  
  format(taskName) {
    // JSON format always shows the complete graph structure
    // taskName parameter is ignored for consistency
    console.log(JSON.stringify(this.graph.toJSON(), null, 2));
  }
}