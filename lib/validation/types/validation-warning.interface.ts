export interface ValidationWarning {
  type: 'warning';
  message: string;
  line?: number | null;
  context?: string | null;
}