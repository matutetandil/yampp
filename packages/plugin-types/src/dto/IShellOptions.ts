/**
 * Shell options DTO
 * Single Responsibility: Shell execution options data structure
 */
export interface IShellOptions {
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeout?: number;
  readonly captureOutput?: boolean;
}