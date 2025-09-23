import { spawn, ChildProcess } from 'child_process';
import { platformDetector } from '../platform/index.js';
import { OutputManager } from '../output/types/output-manager.js';
import { InternalFunctionRegistry } from '../internal-functions/internal-function-registry.js';
import { IInternalFunctionRegistry } from '../internal-functions/internal-function-registry.interface.js';
import type { ShellContentManager as IShellContentManager } from '../shell/types/shell-content-manager.js';
import { ExecuteInternalFunctionCallback } from '../internal-functions/execute-internal-function-callback.js';
import { ExecutionContext } from './types/execution-context.js';
import { ShellProxyManager } from '../shell/types/shell-proxy-manager.js';
import { ICommandExecutor } from './interfaces/command-executor.interface.js';
import type { SharedStateManager } from '../state-sync/shared-state-manager.js';
import { InterceptRequest } from '../core/types/intercept-request.js';
import type { ParsedParameter } from '../core/types/parsed-parameter.js';

/**
 * CommandExecutor handles the execution of individual shell commands
 * Separated from Runner for Single Responsibility Principle
 */
export class CommandExecutor implements ICommandExecutor {
  private readonly outputManager: OutputManager;
  private readonly functionRegistry: IInternalFunctionRegistry;
  private readonly shellContentManager: IShellContentManager;
  private readonly executeInternalFunctionCallback: ExecuteInternalFunctionCallback;
  private readonly workingDirectory: string;

  constructor(
    outputManager: OutputManager,
    functionRegistry: IInternalFunctionRegistry,
    shellContentManager: IShellContentManager,
    executeInternalFunctionCallback: ExecuteInternalFunctionCallback,
    workingDirectory: string = process.cwd()
  ) {
    this.outputManager = outputManager;
    this.functionRegistry = functionRegistry;
    this.shellContentManager = shellContentManager;
    this.executeInternalFunctionCallback = executeInternalFunctionCallback;
    this.workingDirectory = workingDirectory;
  }

  
  /**
   * Execute a single command with variable substitution and environment setup
   * @param command - Command to execute
   * @param taskName - Task name for logging
   * @param taskId - Task ID for output tracking
   * @param variables - Variables to export to shell environment
   * @returns Success status
   */
  public async executeCommand(
    command: string, 
    taskName: string, 
    taskId: string, 
    variables: Map<string, string> = new Map(),
    localVariables?: any[],
    localConstants?: any[]
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      // Get state manager and proxy manager (still needed for intercept processing)
      const platform = platformDetector.getCurrentPlatformStrategy();
      const stateManager = platform.getStateManager();
      const proxyManager = platform.getShellProxyManager(this.functionRegistry as any);
      
      // Process command content (comments, proxies, etc.)
      let executionContext: ExecutionContext;
      const needsProcessing = this.shellContentManager.needsProcessing(command);
      if (needsProcessing) {
        // Use ShellContentManager for comprehensive processing
        // Pass local variables for proper variable processing
        executionContext = this.shellContentManager.process(command, localVariables, localConstants) as any;
      } else {
        // Use traditional execution without processing
        const shellCommand = platformDetector.getCurrentPlatformStrategy().prepareShellCommand(command);
        executionContext = {
          ...shellCommand,
          hasProxies: false,
          content: command
        };
      }
      
      const { shell, args, hasProxies } = executionContext;
      const processedCommand = executionContext.content || command;
      
      // Build environment with Yampp variables exported to shell
      const shellEnv: NodeJS.ProcessEnv = { ...process.env };
      for (const [name, value] of variables) {
        shellEnv[name] = value;
      }
      
      const child = spawn(shell, args || [], {
        env: shellEnv,
        stdio: ['ignore', 'pipe', 'pipe']  // Ignore stdin, pipe stdout and stderr
      });
      
      let stderrOutput = '';
      
      child.stdout?.on('data', (data: any) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {  // Only log non-empty lines
            this.outputManager.addOutput(taskId, line, false);
          }
        }
      });
      
      child.stderr?.on('data', (data: any) => {
        const dataString = data.toString();
        stderrOutput += dataString;
        
        if (hasProxies) {
          // Process intercept messages from proxy functions
          this.processInterceptMessages(dataString, proxyManager, stateManager, child.pid!, taskId);
        }
        
        // Log stderr (but filter out intercept messages for cleaner output)
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('YAMPP_INTERCEPT:')) {
            this.outputManager.addOutput(taskId, line, true);
          }
        }
      });
      
      child.on('close', async (code: any) => {
        // With proxy system, we don't need fallback interception
        // Commands either succeed or fail naturally
        resolve(code === 0);
      });
      
      child.on('error', (error: any) => {
        this.outputManager.addOutput(taskId, `Error: ${error.message}`, true);
        resolve(false);
      });
    });
  }
  
  /**
   * Execute a prepared command with full execution context
   * @param executionContext - Prepared command context
   * @param taskName - Task name for logging
   * @param taskId - Task ID for output tracking
   * @returns Success status
   */
  public async executePreparedCommand(
    executionContext: ExecutionContext, 
    taskName: string, 
    taskId: string
  ): Promise<boolean> {
    const { shell, args, hasProxies } = executionContext;
    
    const stateManager = platformDetector.getCurrentPlatformStrategy().getStateManager();
    const proxyManager = platformDetector.getCurrentPlatformStrategy().getShellProxyManager(this.functionRegistry as any);
    
    let stdoutOutput = '';
    let stderrOutput = '';
    
    return new Promise((resolve) => {
      const child = spawn(shell, args || [], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: this.workingDirectory,
        env: { ...process.env }
      });
      
      child.stdout?.on('data', (data: any) => {
        const dataString = data.toString();
        stdoutOutput += dataString;
        
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.outputManager.addOutput(taskId, line, false);
          }
        }
      });
      
      child.stderr?.on('data', (data: any) => {
        const dataString = data.toString();
        stderrOutput += dataString;
        
        // TEMP DEBUG: Log hasProxies status and stderr content
        if (dataString.includes('YAMPP_INTERCEPT:')) {
        }
        
        // TEMP DEBUG: Log all stderr to see if we're getting it
        if (dataString.trim()) {
        }
        
        if (hasProxies) {
          // Process intercept messages from proxy functions
          this.processInterceptMessages(dataString, proxyManager, stateManager, child.pid!, taskId);
        }
        
        // Log stderr (but filter out intercept messages for cleaner output)
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('YAMPP_INTERCEPT:')) {
            this.outputManager.addOutput(taskId, line, true);
          }
        }
      });
      
      child.on('close', async (code: any) => {
        resolve(code === 0);
      });
      
      child.on('error', (error: any) => {
        this.outputManager.addOutput(taskId, `Error: ${error.message}`, true);
        resolve(false);
      });
    });
  }
  
  /**
   * Process intercept messages from shell proxy functions
   * @param stderr - stderr data from shell process
   * @param proxyManager - Shell proxy manager
   * @param stateManager - State manager for variables
   * @param processId - Process ID
   * @param taskId - Task ID for logging
   */
  private async processInterceptMessages(
    stderr: string, 
    proxyManager: ShellProxyManager, 
    stateManager: SharedStateManager, 
    processId: number, 
    taskId: string
  ): Promise<void> {
    
    // Parse intercept request from shell proxy
    const interceptRequest: InterceptRequest | null = proxyManager.parseInterceptRequest(stderr);
    
    if (!interceptRequest) {
      return; // No intercept message found
    }
    
    
    const { functionName, args } = interceptRequest;
    
    try {
      // Convert args directly to parsed params (skip platform parsing since we already have correct args)
      const parsedParams: ParsedParameter[] = args.map(arg => {
        // Determine type based on content
        if (arg.startsWith('$')) {
          return { type: 'variable' as const, name: arg.substring(1) };
        } else if (arg.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
          return { type: 'identifier' as const, value: arg };
        } else {
          return { type: 'string' as const, value: arg };
        }
      });
      
      // Resolve parameter variables using state manager  
      const resolvedParams = platformDetector.getCurrentPlatformStrategy().resolveParameterVariables(parsedParams, stateManager);
      
      // Create internal function object with proper param format
      const internalFunctionParams = resolvedParams.map(param => {
        if (param.type === 'identifier') {
          return { type: 'string' as const, value: param.value };
        }
        return param as any; // Other types should be compatible
      });

      const internalFunction = {
        name: functionName,
        params: internalFunctionParams
      };
      
      // Execute internal function with state context
      const taskContext = {
        variables: stateManager.getInternalVariables(),
        taskPromises: new Map<string, Promise<boolean>>(),
        limit: async (fn: () => Promise<unknown>) => { await fn(); return true; },
        serialLimit: async (fn: () => Promise<unknown>) => { await fn(); return true; }
      };
      
      // Execute function using registry
      await this.functionRegistry.execute(
        internalFunction,
        taskContext.variables,
        `proxy-${functionName}`,
        taskContext.taskPromises,
        taskContext.limit,
        taskContext.serialLimit
      );
      
      // Sync taskContext.variables to stateManager.internalContext
      for (const [key, value] of taskContext.variables) {
        stateManager.setVariable(key, value);
      }
      
      // Sync variables back to state manager
      stateManager.syncToShell();
      
      // Get return value from variables if this function has returnVariable: true
      let returnValue: string | null = null;
      const firstArg = args[0]; // First argument should be variable name now
      if (firstArg && taskContext.variables.has(firstArg)) {
        returnValue = taskContext.variables.get(firstArg) || null;
      }
      
      // Send success response to shell with pending exports and return value
      const pendingExports = stateManager.getPendingExports();
      await proxyManager.sendInterceptResponse(processId, true, pendingExports, returnValue);
      
    } catch (error) {
      // Log error and send failure response
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputManager.addOutput(taskId, `Internal function error: ${errorMessage}`, true);
      await proxyManager.sendInterceptResponse(processId, false, undefined, null);
    }
  }

  // ICommandExecutor interface implementation
  /**
   * Execute multiple commands in sequence
   */
  public async executeCommands(
    commands: string[],
    taskName: string,
    taskId: string,
    variables: Map<string, string> = new Map(),
    localVariables?: any[],
    localConstants?: any[]
  ): Promise<boolean> {
    for (const command of commands) {
      const success = await this.executeCommand(command, taskName, taskId, variables, localVariables, localConstants);
      if (!success) {
        return false;
      }
    }
    return true;
  }

  /**
   * Process shell content with variable substitution and internal function calls
   */
  public async processShellContent(content: string, variables: Map<string, string>): Promise<string> {
    const context = this.shellContentManager.process(content);
    return context.content;
  }

  /**
   * Execute command in specific working directory
   */
  public async executeInDirectory(
    command: string,
    directory: string,
    taskName: string,
    taskId: string,
    variables: Map<string, string> = new Map()
  ): Promise<boolean> {
    const originalDir = this.workingDirectory;
    try {
      // Temporarily change working directory
      const executor = new CommandExecutor(
        this.outputManager,
        this.functionRegistry,
        this.shellContentManager,
        this.executeInternalFunctionCallback,
        directory
      );
      return executor.executeCommand(command, taskName, taskId, variables);
    } finally {
      // Restore original working directory (if needed in future)
    }
  }
}