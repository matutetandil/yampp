import { BaseInternalFunction } from './base-function.js';

/**
 * Handler for __call internal function
 * Calls other tasks internally with parameters
 */
export class CallFunction extends BaseInternalFunction {
  async execute(func, variables, signature, taskPromises, limit, serialLimit) {
    // Parse parameters: __call taskname(param1, param2, ...)
    if (func.params.length < 1) {
      throw new Error('__call requires at least the task name');
    }
    
    let taskName;
    let params = [];
    
    // First param is the task name
    if (func.params[0].type === 'identifier') {
      taskName = func.params[0].value;
    } else {
      throw new Error('__call requires a task name as first parameter');
    }
    
    // Second param (if exists) contains the parameters
    if (func.params.length > 1 && func.params[1].type === 'params') {
      // Parameters are in parentheses format
      params = func.params[1].value || [];
    }
    
    // Convert to the format expected by executeCall
    const call = {
      taskName: taskName,
      params: params
    };
    
    return await this.runner.executeCall(call, variables, taskPromises, limit, serialLimit);
  }
}