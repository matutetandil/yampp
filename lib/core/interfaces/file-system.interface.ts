/**
 * File system abstraction interface
 * Allows for testability and alternative implementations
 * Following Dependency Inversion Principle
 */
export interface IFileSystem {
  /**
   * Check if file exists at given path
   * @param path - File path to check
   * @returns True if file exists, false otherwise
   */
  exists(path: string): boolean;

  /**
   * Read file contents as UTF-8 string
   * @param path - File path to read
   * @returns File contents as string
   * @throws Error if file cannot be read
   */
  readFile(path: string): string;
}