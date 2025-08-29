import { SharedStateManager } from './shared-state-manager.js';
import { spawn } from 'child_process';

/**
 * Unix/Linux state manager for bash/sh shells
 * Handles variable synchronization with bash environment
 */
export class UnixStateManager extends SharedStateManager {
  constructor(platformStrategy) {
    super(platformStrategy);
  }

  async captureShellContext(command, workingDirectory = process.cwd()) {
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
        this.shellContext = variables;
        resolve(variables);
      });

      child.on('error', () => {
        // Fallback to process.env if shell capture fails
        const envVars = new Map(Object.entries(process.env));
        this.shellContext = envVars;
        resolve(envVars);
      });
    });
  }

  extractContextFromError(command, stderr) {
    const variables = new Map();
    
    // Extract variables from bash error context
    // Look for patterns like: for i in 1 2 3; do
    const forLoopMatch = command.match(/for\s+(\w+)\s+in\s+([^;]+);/);
    if (forLoopMatch) {
      const loopVar = forLoopMatch[1];
      const values = forLoopMatch[2].trim().split(/\s+/);
      
      // Try to determine which iteration failed by analyzing stderr
      // This is heuristic-based and might need refinement
      const lineMatch = stderr.match(/line\s+(\d+)/);
      if (lineMatch && values.length > 0) {
        // Simple heuristic: assume first iteration for now
        // TODO: More sophisticated iteration detection
        variables.set(loopVar, values[0]);
      }
    }

    // Extract variables from command context
    const varMatches = command.matchAll(/(\w+)=(['"]?)([^'"\s]+)\2/g);
    for (const match of varMatches) {
      variables.set(match[1], match[3]);
    }

    return variables;
  }

  parseShellOutput(output) {
    const variables = new Map();
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
      if (match) {
        const [, name, value] = match;
        
        // Clean up quoted values
        let cleanValue = value;
        if (value.startsWith('"') && value.endsWith('"')) {
          cleanValue = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          cleanValue = value.slice(1, -1);
        }
        
        variables.set(name, cleanValue);
      }
    }

    return variables;
  }

  generateExportCommands() {
    if (this.pendingExports.size === 0) {
      return '';
    }

    const commands = [];
    for (const [name, value] of this.pendingExports) {
      // Escape value for shell safety
      const escapedValue = this.escapeShellValue(value);
      commands.push(`export ${name}="${escapedValue}"`);
    }

    // Clear pending exports after generating commands
    this.pendingExports.clear();
    
    return commands.join('; ');
  }

  escapeShellValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    // Escape special characters for bash
    return value.replace(/["\\$`]/g, '\\$&');
  }

  /**
   * Enhanced context extraction for bash loops and conditions
   * @param {string} command - Full command being executed
   * @returns {Map} - Extracted context variables
   */
  extractLoopContext(command) {
    const variables = new Map();

    // Handle for loops: for var in values; do
    const forMatches = command.matchAll(/for\s+(\w+)\s+in\s+([^;]+);/g);
    for (const match of forMatches) {
      const loopVar = match[1];
      const valueList = match[2].trim();
      
      // Parse value list
      const values = valueList.split(/\s+/).filter(v => v.trim());
      if (values.length > 0) {
        // For now, assume first value (can be enhanced with better iteration tracking)
        variables.set(loopVar, values[0]);
      }
    }

    // Handle variable assignments in command
    const assignMatches = command.matchAll(/(\w+)=(['"]?)([^'"\s]+)\2/g);
    for (const match of assignMatches) {
      variables.set(match[1], match[3]);
    }

    return variables;
  }
}