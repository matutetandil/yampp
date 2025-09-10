/**
 * Function metadata interface
 */
export interface FunctionMetadata {
  name: string;
  description: string;
  returnVariable?: boolean;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}