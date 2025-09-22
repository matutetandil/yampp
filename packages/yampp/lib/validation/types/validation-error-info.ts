export interface ValidationErrorInfo {
  message: string;
  line?: number;
  column?: number;
  type?: string;
  severity?: 'error' | 'warning';
}