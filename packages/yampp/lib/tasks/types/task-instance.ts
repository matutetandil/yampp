export interface TaskInstance {
  id: string;
  taskName: string;
  task: any; // Will be typed more specifically later
  parameters: string[];
  signature: string;
}