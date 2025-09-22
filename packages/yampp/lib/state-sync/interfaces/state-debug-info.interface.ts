export interface StateDebugInfo {
  sharedState: Record<string, any>;
  shellContext: Record<string, any>;
  internalContext: Record<string, any>;
  pendingExports: Record<string, any>;
}