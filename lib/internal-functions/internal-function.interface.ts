import { IInternalFunctionParam } from './internal-function-param.interface.js';

export interface IInternalFunction {
  name: string;
  params: IInternalFunctionParam[];
}