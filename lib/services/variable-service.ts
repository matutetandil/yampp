import { IVariableService } from '../core/types/variable-service.interface.js';
import { IVariableMap } from '../core/types/variable-map.interface.js';
import { IConstantMap } from '../core/types/constant-map.interface.js';
import { IEnvironmentVariableMap } from '../core/types/environment-variable-map.interface.js';

export class VariableService implements IVariableService {
  constructor(
    private readonly _globalVariables: IVariableMap,
    private readonly _globalConstants: IConstantMap,
    private readonly _globalEnvironmentVariables: IEnvironmentVariableMap
  ) {}

  public getGlobalVariables(): IVariableMap {
    return this._globalVariables;
  }

  public getGlobalConstants(): IConstantMap {
    return this._globalConstants;
  }

  public getGlobalEnvironmentVariables(): IEnvironmentVariableMap {
    return this._globalEnvironmentVariables;
  }

  public setVariable(name: string, value: string | number | boolean): void {
    this._globalVariables.set(name, value);
  }

  public getVariable(name: string): string | number | boolean | undefined {
    return this._globalVariables.get(name) 
      ?? this._globalConstants.get(name) 
      ?? this._globalEnvironmentVariables.get(name);
  }

  public substituteVariables(content: string, variables: IVariableMap): string {
    let result = content;
    
    // Substitute variables from the provided map
    for (const [key, value] of variables) {
      const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}\\b`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Substitute global variables
    for (const [key, value] of this._globalVariables) {
      const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}\\b`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Substitute global constants
    for (const [key, value] of this._globalConstants) {
      const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}\\b`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Substitute environment variables
    for (const [key, value] of this._globalEnvironmentVariables) {
      const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}\\b`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
}