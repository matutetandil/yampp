/**
 * Import statement from parser
 * Single Responsibility: Data structure for import statements
 */
export interface ImportStatement {
  type: 'import';
  source: string;  // Now a simple string instead of complex object
  version: string | null;
  location: any;
}