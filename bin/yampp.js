#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import chalk from 'chalk';
import { parseArgs } from 'util';
import { Runner } from '../lib/runner.js';
import { Parser } from '../lib/parser.js';
import { Validator } from '../lib/validator.js';
import { 
  CommandRegistry, 
  CleanCommand, 
  ListCommand, 
  GraphCommand, 
  DryRunCommand, 
  PlanCommand, 
  WatchCommand, 
  ExecuteCommand 
} from '../lib/commands/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const version = packageJson.version;

// Parse command line arguments
const options = {
  file: {
    type: 'string',
    short: 'f',
    default: 'Yamfile'
  },
  jobs: {
    type: 'string',
    short: 'j',
    default: String(os.cpus().length)
  },
  force: {
    type: 'boolean',
    default: false
  },
  list: {
    type: 'boolean',
    short: 'l',
    default: false
  },
  graph: {
    type: 'boolean',
    short: 'g',
    default: false
  },
  'graph-format': {
    type: 'string',
    default: 'text'
  },
  watch: {
    type: 'boolean',
    short: 'w',
    default: false
  },
  clean: {
    type: 'boolean',
    short: 'c',
    default: false
  },
  verbose: {
    type: 'boolean',
    short: 'v',
    default: false
  },
  quiet: {
    type: 'boolean',
    short: 'q',
    default: false
  },
  ugly: {
    type: 'boolean',
    short: 'u',
    default: false
  },
  'verbose-ugly': {
    type: 'boolean',
    default: false
  },
  'dry-run': {
    type: 'boolean',
    short: 'n',
    default: false
  },
  plan: {
    type: 'boolean',
    short: 'p',
    default: false
  },
  input: {
    type: 'string',
    multiple: true,
    default: []
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  },
  version: {
    type: 'boolean',
    default: false
  }
};

let args;
try {
  const result = parseArgs({
    options,
    allowPositionals: true,
    strict: false
  });
  args = result;
} catch (error) {
  console.error(chalk.red('Error parsing arguments:'), error.message);
  process.exit(1);
}

// Show help
if (args.values.help) {
  console.log(`
${chalk.bold('Yam++ - Yet Another Modern Task Runner')}

${chalk.yellow('Usage:')}
  yampp [options] [task1 task2 ...]

${chalk.yellow('Options:')}
  -f, --file <path>    Path to Yamfile (default: ./Yamfile)
  -j, --jobs <n>       Number of parallel jobs (default: CPU cores)
  --force              Force execution (ignore cache)
  -l, --list           List all available tasks
  -g, --graph          Show task dependency graph
  --graph-format <fmt> Graph output format: text, dot, json (default: text)
  -w, --watch          Watch for file changes and re-execute tasks (Ctrl+C twice to exit)
  -c, --clean          Clean all .done cache files
  -v, --verbose        Enable verbose output (no task collapsing)
  -q, --quiet          Suppress all output
  -u, --ugly           Enable ugly mixed output (everything together)
  --verbose-ugly       Enable verbose ugly mode (detailed output with prefixes)
  -n, --dry-run        Show what would be executed without running
  -p, --plan           Show execution plan (similar to Terraform)
  --input key=value    Override input prompts (can be used multiple times)
  -h, --help           Show this help message
  --version            Show version number

${chalk.yellow('Examples:')}
  yampp                Run default task (first or 'all')
  yampp build test     Run specific tasks
  yampp -j 2 build     Run with 2 parallel jobs
  yampp -l             List all tasks
  yampp -g             Show dependency graph
  yampp -c             Clean cache
  yampp -u build       Run with ugly mixed output
  yampp -n test        Dry run - show what would be executed
  yampp -p build       Show execution plan
  yampp -w build       Watch and re-run when files change

${chalk.gray('For more information, visit: https://github.com/yourusername/yampp')}
`);
  process.exit(0);
}

// Show version
if (args.values.version) {
  console.log(`yampp v${version}`);
  process.exit(0);
}

// Main execution
async function main() {
  try {
    const yamfile = resolve(args.values.file);
    
    // Check if Yamfile exists
    if (!existsSync(yamfile)) {
      console.error(chalk.red.bold('Error:'), `Yamfile not found at: ${yamfile}`);
      console.error(chalk.gray('Use -f to specify a different file or create a Yamfile in the current directory'));
      process.exit(1);
    }
    
    // Read and parse Yamfile
    const content = readFileSync(yamfile, 'utf-8');
    const parser = new Parser();
    const { tasks, globalVariables, globalConstants, globalEnvironmentVariables } = parser.parse(content);
    
    // Validate syntax and semantics
    const validator = new Validator();
    const validation = validator.validate(tasks, globalVariables, globalConstants);
    
    if (!validation.valid) {
      console.error(chalk.red.bold('Validation errors found:'));
      validation.errors.forEach(error => {
        console.error(chalk.red(`  ✗ ${error.message}`));
        if (error.line) {
          console.error(chalk.gray(`    at line ${error.line}: ${error.context}`));
        }
      });
      process.exit(1);
    }
    
    // Parse input overrides
    const inputOverrides = new Map();
    if (args.values.input && args.values.input.length > 0) {
      for (const override of args.values.input) {
        const [key, ...valueParts] = override.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          inputOverrides.set(key, value);
        } else {
          console.warn(chalk.yellow(`Invalid input override format: ${override}. Use key=value`));
        }
      }
    }
    
    // Create runner
    const runner = new Runner(tasks, globalVariables, globalConstants, globalEnvironmentVariables, {
      maxJobs: parseInt(args.values.jobs) || undefined,
      verbose: args.values.verbose,
      quiet: args.values.quiet,
      force: args.values.force,
      ugly: args.values.ugly,
      verboseUgly: args.values['verbose-ugly'],
      dryRun: args.values['dry-run'],
      plan: args.values.plan,
      inputOverrides: inputOverrides
    });
    
    // Setup command registry
    const commandRegistry = new CommandRegistry();
    commandRegistry.register('clean', CleanCommand);
    commandRegistry.register('list', ListCommand);
    commandRegistry.register('graph', GraphCommand);
    commandRegistry.register('dry-run', DryRunCommand);
    commandRegistry.register('plan', PlanCommand);
    commandRegistry.register('watch', WatchCommand);
    commandRegistry.register('execute', ExecuteCommand);
    
    // Command mapping for flag-based commands (without task arguments)
    const flagCommands = {
      'clean': { 
        name: 'clean',
        getArgs: () => null
      },
      'list': { 
        name: 'list',
        getArgs: () => null
      },
      'graph': { 
        name: 'graph',
        getArgs: () => ({
          taskName: args.positionals[0],
          format: args.values['graph-format']
        })
      }
    };
    
    // Execute flag-based commands if present
    for (const [flag, config] of Object.entries(flagCommands)) {
      if (args.values[flag]) {
        const result = await commandRegistry.execute(config.name, runner, config.getArgs());
        
        if (!result.success) {
          console.error(chalk.red('✗'), result.message);
          if (result.error) {
            console.error(chalk.gray(result.error));
          }
          process.exit(1);
        }
        
        if (result.message && flag === 'clean') {
          console.log(chalk.green('✔'), result.message);
        }
        
        process.exit(0);
      }
    }
    
    // Parse tasks and their parameters
    let tasksToRun = args.positionals;
    
    // If no tasks specified, run default (first task or 'all')
    if (tasksToRun.length === 0) {
      if (tasks.has('all')) {
        tasksToRun = ['all'];
      } else {
        const firstTask = Array.from(tasks.keys())[0];
        if (firstTask) {
          tasksToRun = [firstTask];
        } else {
          console.error(chalk.yellow('No tasks found in Yamfile'));
          process.exit(1);
        }
      }
    }
    
    // Parse task calls (task or task:param1:param2:param3)
    const taskCalls = parseTaskCalls(tasksToRun, tasks);
    
    // Command mapping for task-based commands (require task arguments)
    const taskCommands = {
      'plan': { 
        name: 'plan',
        requiresTasks: true
      },
      'dry-run': { 
        name: 'dry-run',
        requiresTasks: true
      },
      'watch': { 
        name: 'watch',
        requiresTasks: true,
        runsIndefinitely: true
      }
    };
    
    // Execute task-based commands if present
    for (const [flag, config] of Object.entries(taskCommands)) {
      if (args.values[flag]) {
        const result = await commandRegistry.execute(config.name, runner, taskCalls);
        
        if (!result.success) {
          console.error(chalk.red('✗'), result.message);
          if (result.error) {
            console.error(chalk.gray(result.error));
          }
          process.exit(1);
        }
        
        if (config.runsIndefinitely) {
          return; // Watch mode runs indefinitely
        }
        
        process.exit(0);
      }
    }
    
    // Default: Execute tasks
    const result = await commandRegistry.execute('execute', runner, taskCalls);
    
    if (!result.success) {
      console.error(chalk.red('✗'), result.message);
      if (result.error) {
        console.error(chalk.gray(result.error));
      }
      process.exit(1);
    }
    
  } catch (error) {
    if (!args.values.quiet) {
      console.error(chalk.red.bold('Fatal error:'), error.message);
      if (args.values.verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

function parseTaskCalls(tasksToRun, allTasks) {
  const taskCalls = [];
  
  for (const taskCall of tasksToRun) {
    // Parse task:param1:param2:param3 or just task
    const parts = taskCall.split(':');
    const taskName = parts[0];
    const params = parts.slice(1);
    
    if (!allTasks.has(taskName)) {
      console.error(chalk.red.bold('Error:'), `Task '${taskName}' not found`);
      process.exit(1);
    }
    
    const task = allTasks.get(taskName);
    
    // Validate parameter count
    if (params.length !== task.parameters.length) {
      if (task.parameters.length === 0) {
        console.error(chalk.red.bold('Error:'), `Task '${taskName}' does not accept parameters, but ${params.length} provided`);
      } else {
        console.error(chalk.red.bold('Error:'), `Task '${taskName}' expects ${task.parameters.length} parameter(s): ${task.parameters.join(', ')}, but ${params.length} provided`);
      }
      process.exit(1);
    }
    
    taskCalls.push({
      taskName,
      parameters: params,
      signature: params.length > 0 ? `${taskName}(${params.join(', ')})` : taskName
    });
  }
  
  return taskCalls;
}

// Run main function
main().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});