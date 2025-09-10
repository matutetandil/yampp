import { IVariableMap } from './variable-map.interface.js';
import { IConstantMap } from './constant-map.interface.js';
import { IEnvironmentVariableMap } from './environment-variable-map.interface.js';

export interface IVariableService {
  getGlobalVariables(): IVariableMap;
  getGlobalConstants(): IConstantMap;
  getGlobalEnvironmentVariables(): IEnvironmentVariableMap;
  setVariable(name: string, value: string | number | boolean): void;
  getVariable(name: string): string | number | boolean | undefined;
  substituteVariables(content: string, variables: IVariableMap): string;
}