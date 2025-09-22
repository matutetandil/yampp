/**
 * Command option DTO
 * Single Responsibility: Command option data structure
 */
export interface ICommandOption {
  readonly flags: string;
  readonly description?: string;
  readonly defaultValue?: any;
  readonly required?: boolean;
}