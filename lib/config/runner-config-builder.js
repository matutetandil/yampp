import { RunnerConfig } from './runner-config.js';

/**
 * Builder for RunnerConfig using fluent interface
 * Applies Builder Pattern for complex configuration scenarios
 */
export class RunnerConfigBuilder {
  constructor() {
    this.config = {};
  }

  /**
   * Set maximum parallel jobs
   * @param {number} jobs - Number of parallel jobs
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  maxJobs(jobs) {
    this.config.maxJobs = jobs;
    return this;
  }

  /**
   * Enable verbose mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  verbose() {
    this.config.verbose = true;
    return this;
  }

  /**
   * Enable quiet mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  quiet() {
    this.config.quiet = true;
    return this;
  }

  /**
   * Enable ugly output mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  ugly() {
    this.config.ugly = true;
    return this;
  }

  /**
   * Enable verbose ugly mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  verboseUgly() {
    this.config.verboseUgly = true;
    return this;
  }

  /**
   * Enable dry run mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  dryRun() {
    this.config.dryRun = true;
    return this;
  }

  /**
   * Enable plan mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  plan() {
    this.config.plan = true;
    return this;
  }

  /**
   * Enable force mode
   * @returns {RunnerConfigBuilder} - Builder instance
   */
  force() {
    this.config.force = true;
    return this;
  }

  /**
   * Build the configuration
   * @returns {RunnerConfig} - Built configuration
   */
  build() {
    return new RunnerConfig(this.config);
  }

  /**
   * Build for development (verbose, force)
   * @returns {RunnerConfig} - Development configuration
   */
  buildForDevelopment() {
    return this.verbose().force().build();
  }

  /**
   * Build for CI/CD (quiet, force)
   * @returns {RunnerConfig} - CI/CD configuration
   */
  buildForCI() {
    return this.quiet().force().build();
  }

  /**
   * Build for testing (dry run, quiet)
   * @returns {RunnerConfig} - Testing configuration
   */
  buildForTesting() {
    return this.dryRun().quiet().build();
  }
}