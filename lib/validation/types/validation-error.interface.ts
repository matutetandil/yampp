export interface ValidationError {
  type: 'error';
  message: string;
  line?: number | null;
  context?: string | null;
}