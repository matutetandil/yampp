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
import { version } from '../package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  -l, --list           List all available tasks
  -g, --graph          Show task dependency graph
  -c, --clean          Clean all .done cache files
  -v, --verbose        Enable verbose output
  -h, --help           Show this help message
  --version            Show version number

${chalk.yellow('Examples:')}
  yampp                Run default task (first or 'all')
  yampp build test     Run specific tasks
  yampp -j 2 build     Run with 2 parallel jobs
  yampp -l             List all tasks
  yampp -g             Show dependency graph
  yampp -c             Clean cache

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
    const { tasks, globalVariables, globalConstants } = parser.parse(content);
    
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
    
    // Create runner
    const runner = new Runner(tasks, globalVariables, globalConstants, {
      maxJobs: parseInt(args.values.jobs) || undefined,
      verbose: args.values.verbose
    });
    
    // Handle different commands
    if (args.values.clean) {
      await runner.clean();
      console.log(chalk.green('✔'), 'Cache cleaned successfully');
      process.exit(0);
    }
    
    if (args.values.list) {
      runner.listTasks();
      process.exit(0);
    }
    
    if (args.values.graph) {
      runner.showGraph(args.positionals[0]);
      process.exit(0);
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
    
    // Execute tasks
    console.log(chalk.green('→'), `Executing tasks: ${taskCalls.map(tc => tc.signature).join(', ')}`);
    const result = await runner.execute(taskCalls);
    
    if (!result.success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red.bold('Fatal error:'), error.message);
    if (args.values.verbose) {
      console.error(error.stack);
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