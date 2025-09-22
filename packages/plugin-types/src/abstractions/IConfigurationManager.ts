/**
 * Configuration manager abstraction
 * Dependency Inversion: Plugin depends on abstraction, not implementation
 */
export interface IConfigurationManager {
  get<T>(key: string): T | undefined;
  set(key: string, value: any): void;
  has(key: string): boolean;
}