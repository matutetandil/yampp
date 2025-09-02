import { spawn } from 'child_process';
import { platformDetector } from '../platform/index.js';

/**
 * CommandExecutor handles the execution of individual shell commands
 * Separated from Runner for Single Responsibility Principle
 */
export class CommandExecutor {
  constructor(outputManager, internalFunctionRegistry, shellContentManager, executeInternalFunctionCallback, workingDirectory = process.cwd()) {
    this.outputManager = outputManager;
    this.internalFunctionRegistry = internalFunctionRegistry;
    this.shellContentManager = shellContentManager;
    this.executeInternalFunctionCallback = executeInternalFunctionCallback;
    this.workingDirectory = workingDirectory;
  }
  
  /**
   * Execute a single command with variable substitution and environment setup
   * @param {string} command - Command to execute
   * @param {string} taskName - Task name for logging
   * @param {string} taskId - Task ID for output tracking
   * @param {Map} variables - Variables to export to shell environment
   * @returns {Promise<boolean>} - Success status
   */
  async executeCommand(command, taskName, taskId, variables = new Map()) {
    return new Promise(async (resolve) => {
      // Get state manager and proxy manager (still needed for intercept processing)
      const stateManager = platformDetector.currentPlatform.getStateManager();
      const proxyManager = platformDetector.currentPlatform.getShellProxyManager(this.internalFunctionRegistry);
      
      // Process command content (comments, proxies, etc.)
      let executionContext;
      if (this.shellContentManager.needsProcessing(command)) {
        // Use ShellContentManager for comprehensive processing
        executionContext = this.shellContentManager.process(command);
      } else {
        // Use traditional execution without processing
        executionContext = platformDetector.currentPlatform.prepareShellCommand(command);
        executionContext.hasProxies = false;
      }
      
      const { shell, args, processedCommand, hasProxies } = executionContext;
      
      // Build environment with Yampp variables exported to shell
      const shellEnv = { ...process.env };
      for (const [name, value] of variables) {
        shellEnv[name] = value;
      }
      
      const child = spawn(shell, args, {
        env: shellEnv,
        stdio: ['ignore', 'pipe', 'pipe']  // Ignore stdin, pipe stdout and stderr
      });
      
      let stderrOutput = '';
      
      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {  // Only log non-empty lines
            this.outputManager.addOutput(taskId, line, false);
          }
        }
      });
      
      child.stderr.on('data', (data) => {
        const dataString = data.toString();
        stderrOutput += dataString;
        
        if (hasProxies) {
          // Process intercept messages from proxy functions
          this.processInterceptMessages(dataString, proxyManager, stateManager, child.pid, taskId);
        }
        
        // Log stderr (but filter out intercept messages for cleaner output)
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('YAMPP_INTERCEPT:')) {
            this.outputManager.addOutput(taskId, line, true);
          }
        }
      });
      
      child.on('close', async (code) => {
        // With proxy system, we don't need fallback interception
        // Commands either succeed or fail naturally
        resolve(code === 0);
      });
      
      child.on('error', (error) => {
        this.outputManager.addOutput(taskId, `Error: ${error.message}`, true);
        resolve(false);
      });
    });
  }
  
  /**
   * Execute a prepared command with full execution context
   * @param {Object} executionContext - Prepared command context
   * @param {string} taskName - Task name for logging
   * @param {string} taskId - Task ID for output tracking
   * @returns {Promise<boolean>} - Success status
   */
  async executePreparedCommand(executionContext, taskName, taskId) {
    const { shell, args, hasProxies } = executionContext;
    
    const stateManager = platformDetector.currentPlatform.getStateManager();
    const proxyManager = platformDetector.currentPlatform.getShellProxyManager(this.internalFunctionRegistry);
    
    let stdoutOutput = '';
    let stderrOutput = '';
    
    return new Promise((resolve) => {
      const child = spawn(shell, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: this.workingDirectory,
        env: { ...process.env }
      });
      
      child.stdout.on('data', (data) => {
        const dataString = data.toString();
        stdoutOutput += dataString;
        
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.outputManager.addOutput(taskId, line, false);
          }
        }
      });
      
      child.stderr.on('data', (data) => {
        const dataString = data.toString();
        stderrOutput += dataString;
        
        if (hasProxies) {
          // Process intercept messages from proxy functions
          this.processInterceptMessages(dataString, proxyManager, stateManager, child.pid, taskId);
        }
        
        // Log stderr (but filter out intercept messages for cleaner output)
        const lines = dataString.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.includes('YAMPP_INTERCEPT:')) {
            this.outputManager.addOutput(taskId, line, true);
          }
        }
      });
      
      child.on('close', async (code) => {
        resolve(code === 0);
      });
      
      child.on('error', (error) => {
        this.outputManager.addOutput(taskId, `Error: ${error.message}`, true);
        resolve(false);
      });
    });
  }
  
  /**
   * Process intercept messages from shell proxy functions
   * @param {string} stderr - stderr data from shell process
   * @param {Object} proxyManager - Shell proxy manager
   * @param {Object} stateManager - State manager for variables
   * @param {number} processId - Process ID
   * @param {string} taskId - Task ID for logging
   */
  async processInterceptMessages(stderr, proxyManager, stateManager, processId, taskId) {
    // Parse intercept request from shell proxy
    const interceptRequest = proxyManager.parseInterceptRequest(stderr);
    
    if (!interceptRequest) {
      return; // No intercept message found
    }
    
    const { functionName, args } = interceptRequest;
    
    try {
      // Convert args directly to parsed params (skip platform parsing since we already have correct args)
      const parsedParams = args.map(arg => {
        // Determine type based on content
        if (arg.startsWith('$')) {
          return { type: 'variable', name: arg.substring(1) };
        } else if (arg.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
          return { type: 'identifier', value: arg };
        } else {
          return { type: 'string', value: arg };
        }
      });
      
      // Resolve parameter variables using state manager  
      const resolvedParams = platformDetector.currentPlatform.resolveParameterVariables(parsedParams, stateManager);
      
      // Create internal function object
      const internalFunction = {
        name: functionName,
        params: resolvedParams
      };
      
      // Execute internal function with state context
      const taskContext = {
        variables: stateManager.getInternalVariables(),
        taskPromises: new Map(),
        limit: (fn) => fn(),
        serialLimit: (fn) => fn()
      };
      
      // Execute internal function using callback
      await this.executeInternalFunctionCallback(
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
      
      // Send success response to shell with pending exports
      const pendingExports = stateManager.pendingExports;
      await proxyManager.sendInterceptResponse(processId, true, pendingExports);
      
    } catch (error) {
      // Log error and send failure response
      this.outputManager.addOutput(taskId, `Internal function error: ${error.message}`, true);
      await proxyManager.sendInterceptResponse(processId, false);
    }
  }
}