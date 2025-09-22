import { EXECUTION_CONFIG } from './constants.js';
import { RunnerConfigBuilder } from './runner-config-builder.js';
import { RunnerConfigOptions } from '../configuration/types/runner-config-options.js';
import { OutputConfig } from '../configuration/types/output-config.js';
import { ExecutionConfig } from '../configuration/types/execution-config.js';

/**
 * Runner Configuration Management
 * Applies Configuration Object Pattern + Builder Pattern
 * Separates configuration concerns from Runner business logic
 */
export class RunnerConfig {
  public readonly maxJobs: number;
  public readonly verbose: boolean;
  public readonly quiet: boolean;
  public readonly ugly: boolean;
  public readonly verboseUgly: boolean;
  public readonly dryRunMode: boolean;
  public readonly plan: boolean;
  public readonly force: boolean;

  constructor(options: RunnerConfigOptions = {}) {
    this.maxJobs = options.maxJobs || EXECUTION_CONFIG.DEFAULT_PARALLEL_JOBS;
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
    this.ugly = options.ugly || false;
    this.verboseUgly = options.verboseUgly || false;
    this.dryRunMode = options.dryRun || false;
    this.plan = options.plan || false;
    this.force = options.force || false;
  }

  /**
   * Create a builder for fluent configuration
   */
  public static builder(): RunnerConfigBuilder {
    return new RunnerConfigBuilder();
  }

  /**
   * Create config from legacy options object
   */
  public static fromOptions(options: RunnerConfigOptions = {}): RunnerConfig {
    return new RunnerConfig(options);
  }

  /**
   * Check if running in interactive mode
   */
  public isInteractive(): boolean {
    return !this.quiet && !this.ugly && process.stdout.isTTY;
  }

  /**
   * Check if output should be verbose
   */
  public isVerbose(): boolean {
    return this.verbose || this.verboseUgly;
  }

  /**
   * Check if in dry run mode
   */
  public isDryRun(): boolean {
    return this.dryRunMode || this.plan;
  }

  /**
   * Get output configuration
   */
  public getOutputConfig(): OutputConfig {
    return {
      verbose: this.verbose,
      quiet: this.quiet,
      ugly: this.ugly,
      verboseUgly: this.verboseUgly
    };
  }

  /**
   * Get execution configuration  
   */
  public getExecutionConfig(): ExecutionConfig {
    return {
      maxJobs: this.maxJobs,
      force: this.force,
      dryRun: this.dryRunMode,
      plan: this.plan
    };
  }

  /**
   * Clone configuration with overrides
   */
  public withOverrides(overrides: RunnerConfigOptions): RunnerConfig {
    return new RunnerConfig({ ...this, ...overrides });
  }
}