/**
 * Context for smart merge operations
 * Contains profiles and file information for merge process
 */
export interface MergeContext {
  activeProfiles: string[];
  mainFilePath: string;
}