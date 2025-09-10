import { Parameter } from '../../core/types/parameter.js';

export interface ITask {
  // Getters for readonly properties
  getName(): string;
  getModifiers(): Set<string>;
  getDependencies(): string[];
  getCommands(): string[];
  getLineNumber(): number | null;
  getDependencyParams(): Record<string, Parameter[]>;
  getWatchedFiles(): string[];
  getLocalVariables(): Map<string, string>;
  getLocalConstants(): Map<string, string>;
  getLocalEnvironmentVariables(): Map<string, string>;
  getCalls(): unknown[];
  getInputs(): unknown[];
  getInternalFunctions(): unknown[];

  // Getters and setters for mutable properties
  getStatus(): string;
  setStatus(status: string): void;
  getError(): string | null;
  setError(error: string | null): void;
  getVariables(): Map<string, string>;

  // Modifier methods
  hasModifier(modifier: string): boolean;
  get isAlways(): boolean;
  get isSerial(): boolean;
  get isCritical(): boolean;
  get isParallel(): boolean;

  // Variable methods
  setVariable(name: string, value: string): void;
  getVariable(name: string): string | undefined;

  // Parameter methods
  getParameters(): Parameter[];
  hasParameter(name: string): boolean;

  // File watching methods
  hasWatchedFiles(): boolean;

  // Signature methods
  getSignature(): string;
  getDependencyWithParams(depName: string): string;

  // Variable substitution
  substituteVariables(command: string): string;
}