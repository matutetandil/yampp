export interface IInternalFunctionParam {
  type: 'string' | 'variable' | 'array';
  value?: string | string[];
  name?: string;
}