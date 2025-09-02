import { EXECUTION_CONFIG } from './constants.js';
import { RunnerConfigBuilder } from './runner-config-builder.js';

/**
 * Runner Configuration Management
 * Applies Configuration Object Pattern + Builder Pattern
 * Separates configuration concerns from Runner business logic
 */
export class RunnerConfig {
  constructor(options = {}) {
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
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  static builder() {
    return new RunnerConfigBuilder();
  }

  /**
   * Create config from legacy options object
   * @param {Object} options - Legacy options
   * @returns {RunnerConfig} - Configuration instance
   */
  static fromOptions(options = {}) {
    return new RunnerConfig(options);
  }

  /**
   * Check if running in interactive mode
   * @returns {boolean} - True if interactive
   */
  isInteractive() {
    return !this.quiet && !this.ugly && process.stdout.isTTY;
  }

  /**
   * Check if output should be verbose
   * @returns {boolean} - True if verbose output
   */
  isVerbose() {
    return this.verbose || this.verboseUgly;
  }

  /**
   * Check if in dry run mode
   * @returns {boolean} - True if dry run
   */
  isDryRun() {
    return this.dryRunMode || this.plan;
  }

  /**
   * Get output configuration
   * @returns {Object} - Output configuration
   */
  getOutputConfig() {
    return {
      verbose: this.verbose,
      quiet: this.quiet,
      ugly: this.ugly,
      verboseUgly: this.verboseUgly
    };
  }

  /**
   * Get execution configuration  
   * @returns {Object} - Execution configuration
   */
  getExecutionConfig() {
    return {
      maxJobs: this.maxJobs,
      force: this.force,
      dryRun: this.dryRunMode,
      plan: this.plan
    };
  }

  /**
   * Clone configuration with overrides
   * @param {Object} overrides - Configuration overrides
   * @returns {RunnerConfig} - New configuration instance
   */
  withOverrides(overrides) {
    return new RunnerConfig({ ...this, ...overrides });
  }
}

