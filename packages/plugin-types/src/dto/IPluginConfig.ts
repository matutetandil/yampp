/**
 * Plugin configuration DTO
 * Single Responsibility: Plugin configuration data structure
 */
export interface IPluginConfig {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly capabilities?: {
    readonly functions?: boolean;
    readonly runtimes?: boolean;
    readonly modifiers?: boolean;
    readonly commands?: boolean;
    readonly lifecycle?: boolean;
  };
}