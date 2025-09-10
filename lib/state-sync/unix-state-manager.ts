import { SharedStateManager } from './shared-state-manager.js';
import { PlatformStrategy } from '../platform/platform-strategy.js';
import { spawn } from 'child_process';

/**
 * Unix/Linux state manager for bash/sh shells
 * Handles variable synchronization with bash environment
 */
export class UnixStateManager extends SharedStateManager {
  constructor(platformStrategy: PlatformStrategy) {
    super(platformStrategy);
  }

  public async captureShellContext(command: string, workingDirectory: string = process.cwd()): Promise<Map<string, any>> {
    return new Promise((resolve) => {
      // Use 'env' command to capture all environment variables
      // and 'set' to capture shell variables
      const captureCommand = 'env; echo "---SHELL-VARS---"; set';
      
      const child = spawn('sh', ['-c', captureCommand], {
        cwd: workingDirectory,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        const variables = this.parseShellOutput(output);
        this.shellContext.clear();
        for (const [key, value] of variables) {
          this.shellContext.set(key, value);
        }
        resolve(variables);
      });

      child.on('error', () => {
        // Fallback to process.env if shell capture fails
        const envVars = new Map(Object.entries(process.env as Record<string, string>));
        this.shellContext.clear();
        for (const [key, value] of envVars) {
          this.shellContext.set(key, value);
        }
        resolve(envVars);
      });
    });
  }

  public extractContextFromError(command: string, stderr: string): Map<string, any> {
    const variables = new Map<string, any>();
    
    // Extract variables from bash error context
    // Look for patterns like: for i in 1 2 3; do
    const forLoopMatch = command.match(/for\s+(\w+)\s+in\s+([^;]+);/);
    if (forLoopMatch && forLoopMatch[1] && forLoopMatch[2]) {
      const loopVar = forLoopMatch[1];
      const values = forLoopMatch[2].trim().split(/\s+/);
      
      // Try to determine which iteration failed by analyzing stderr
      // This is heuristic-based and might need refinement
      const lineMatch = stderr.match(/line\s+(\d+)/);
      if (lineMatch && lineMatch[1] && values.length > 0) {
        // Simple heuristic: assume first iteration for now
        // TODO: More sophisticated iteration detection
        variables.set(loopVar, values[0] || '');
      }
    }

    // Extract variables from command context
    const varMatches = command.matchAll(/(\w+)=(['"]?)([^'"\s]+)\2/g);
    for (const match of varMatches) {
      if (match[1] && match[3]) {
        variables.set(match[1], match[3]);
      }
    }

    return variables;
  }

  private parseShellOutput(output: string): Map<string, any> {
    const variables = new Map<string, any>();
    const lines = output.split('\n');
    let inShellVars = false;

    for (const line of lines) {
      if (line === '---SHELL-VARS---') {
        inShellVars = true;
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse variable assignments
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && match[1] && match[2]) {
        const [, name, value] = match;
        
        // Clean up quoted values
        let cleanValue = value;
        if (value?.startsWith('"') && value?.endsWith('"')) {
          cleanValue = value.slice(1, -1);
        } else if (value?.startsWith("'") && value?.endsWith("'")) {
          cleanValue = value.slice(1, -1);
        }
        
        variables.set(name, cleanValue || '');
      }
    }

    return variables;
  }

  public generateExportCommands(): string {
    if (this.pendingExports.size === 0) {
      return '';
    }

    const commands: string[] = [];
    for (const [name, value] of this.pendingExports) {
      // Escape value for shell safety
      const escapedValue = this.escapeShellValue(value);
      commands.push(`export ${name}="${escapedValue}"`);
    }

    // Clear pending exports after generating commands
    this.pendingExports.clear();
    
    return commands.join('; ');
  }

  private escapeShellValue(value: any): string {
    let stringValue: string;
    if (typeof value !== 'string') {
      stringValue = String(value);
    } else {
      stringValue = value;
    }
    
    // Escape special characters for bash
    return stringValue.replace(/["\\$`]/g, '\\$&');
  }

  /**
   * Enhanced context extraction for bash loops and conditions
   */
  public extractLoopContext(command: string): Map<string, any> {
    const variables = new Map<string, any>();

    // Handle for loops: for var in values; do
    const forMatches = command.matchAll(/for\s+(\w+)\s+in\s+([^;]+);/g);
    for (const match of forMatches) {
      if (match[1] && match[2]) {
        const loopVar = match[1];
        const valueList = match[2].trim();
        
        // Parse value list
        const values = valueList.split(/\s+/).filter(v => v.trim());
        if (values.length > 0) {
          // For now, assume first value (can be enhanced with better iteration tracking)
          variables.set(loopVar, values[0] || '');
        }
      }
    }

    // Handle variable assignments in command
    const assignMatches = command.matchAll(/(\w+)=(['"]?)([^'"\s]+)\2/g);
    for (const match of assignMatches) {
      if (match[1] && match[3]) {
        variables.set(match[1], match[3]);
      }
    }

    return variables;
  }
}