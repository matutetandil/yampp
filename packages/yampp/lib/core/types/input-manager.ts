export interface InputManager {
  detectCI(): boolean;
  getInput(type: string, prompt: string, variable: string, defaultValue?: string | null, options?: string[]): Promise<string>;
  promptText(prompt: string, defaultValue?: string): Promise<string>;
  promptPassword(prompt: string, defaultValue?: string): Promise<string>;
  promptConfirm(prompt: string, defaultValue?: string): Promise<string>;
  promptSelect(prompt: string, options: string[], defaultValue?: string): Promise<string>;
  parseOverrides(overrideArray: string[]): Map<string, string>;
}