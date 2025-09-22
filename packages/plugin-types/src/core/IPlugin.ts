/**
 * Core plugin interface - defines plugin metadata only
 * Single Responsibility: Plugin identification
 */
export interface IPlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}