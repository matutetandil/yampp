import { readFileSync, existsSync } from 'fs';
import type { IFileSystem } from '../interfaces/file-system.interface.js';

/**
 * Node.js file system implementation
 * Concrete implementation of IFileSystem using Node.js fs module
 */
export class NodeFileSystem implements IFileSystem {
  /**
   * Check if file exists using Node.js fs.existsSync
   */
  public exists(path: string): boolean {
    return existsSync(path);
  }

  /**
   * Read file contents using Node.js fs.readFileSync
   */
  public readFile(path: string): string {
    try {
      return readFileSync(path, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read file '${path}': ${error.message}`);
    }
  }
}