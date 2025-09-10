import { RunnerConfig } from './runner-config.js';
import { RunnerConfigOptions } from '../configuration/types/runner-config-options.js';

/**
 * Builder for RunnerConfig using fluent interface
 * Applies Builder Pattern for complex configuration scenarios
 */
export class RunnerConfigBuilder {
  private readonly config: RunnerConfigOptions;

  constructor() {
    this.config = {};
  }

  /**
   * Set maximum parallel jobs
   */
  public maxJobs(jobs: number): RunnerConfigBuilder {
    this.config.maxJobs = jobs;
    return this;
  }

  /**
   * Enable verbose mode
   */
  public verbose(): RunnerConfigBuilder {
    this.config.verbose = true;
    return this;
  }

  /**
   * Enable quiet mode
   */
  public quiet(): RunnerConfigBuilder {
    this.config.quiet = true;
    return this;
  }

  /**
   * Enable ugly output mode
   */
  public ugly(): RunnerConfigBuilder {
    this.config.ugly = true;
    return this;
  }

  /**
   * Enable verbose ugly mode
   */
  public verboseUgly(): RunnerConfigBuilder {
    this.config.verboseUgly = true;
    return this;
  }

  /**
   * Enable dry run mode
   */
  public dryRun(): RunnerConfigBuilder {
    this.config.dryRun = true;
    return this;
  }

  /**
   * Enable plan mode
   */
  public plan(): RunnerConfigBuilder {
    this.config.plan = true;
    return this;
  }

  /**
   * Enable force mode
   */
  public force(): RunnerConfigBuilder {
    this.config.force = true;
    return this;
  }

  /**
   * Build the configuration
   */
  public build(): RunnerConfig {
    return new RunnerConfig(this.config);
  }

  /**
   * Build for development (verbose, force)
   */
  public buildForDevelopment(): RunnerConfig {
    return this.verbose().force().build();
  }

  /**
   * Build for CI/CD (quiet, force)
   */
  public buildForCI(): RunnerConfig {
    return this.quiet().force().build();
  }

  /**
   * Build for testing (dry run, quiet)
   */
  public buildForTesting(): RunnerConfig {
    return this.dryRun().quiet().build();
  }
}