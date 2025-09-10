export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}