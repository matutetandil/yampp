export interface IRunnerOptions {
  maxJobs?: number;
  verbose?: boolean;
  quiet?: boolean;
  ugly?: boolean;
  verboseUgly?: boolean;
  dryRunMode?: boolean;
  plan?: boolean;
  force?: boolean;
  watch?: boolean;
  format?: string;
  [key: string]: unknown;
}