/**
 * Import resolver interface
 * Single Responsibility: Define contract for resolving different import types
 */
export interface IImportResolver {
  readonly type: string;
  matches(importString: string): boolean;
  resolve(importString: string): Promise<string>;

  // Legacy methods - to be removed
  canResolve?(source: ImportSource): boolean;
}

/**
 * Import source types from parser
 */
export interface ImportSource {
  type: 'npm' | 'git' | 'https' | 'file';
  package?: string;
  host?: string;
  path?: string;
  url?: string;
}