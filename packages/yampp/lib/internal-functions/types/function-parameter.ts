import { ParameterType } from './parameter-type.js';

/**
 * Parameter definition for internal functions
 */
export interface FunctionParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}