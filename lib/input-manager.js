import readline from 'readline';
import chalk from 'chalk';
import { promisify } from 'util';

export class InputManager {
  constructor(options = {}) {
    this.overrides = options.overrides || new Map();
    this.isCI = this.detectCI();
    this.nonInteractive = options.nonInteractive || this.isCI;
    this.dryRun = options.dryRun || false;
    this.plan = options.plan || false;
  }

  detectCI() {
    // Check common CI environment variables
    return !!(
      process.env.CI ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.JENKINS_HOME ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.TRAVIS ||
      process.env.DRONE ||
      process.env.AZURE_PIPELINES_BUILD_ID
    );
  }

  async getInput(type, prompt, variable, defaultValue, options = []) {
    // Check if we have an override from CLI
    if (this.overrides.has(variable)) {
      const value = this.overrides.get(variable);
      if (!this.dryRun && !this.plan) {
        console.log(chalk.gray(`  Using CLI override: ${variable}=${value}`));
      }
      return value;
    }

    // In dry-run or plan mode, just show what would happen
    if (this.dryRun) {
      console.log(chalk.gray(`  → Would prompt: "${prompt}" (variable: ${variable}, default: ${defaultValue || 'none'})`));
      return defaultValue || '';
    }

    if (this.plan) {
      return null; // Don't show details in plan mode, handled elsewhere
    }

    // In non-interactive mode (CI/CD), use default or fail
    if (this.nonInteractive) {
      if (defaultValue !== null && defaultValue !== undefined) {
        console.log(chalk.gray(`  Non-interactive mode: using default for ${variable}=${defaultValue}`));
        return defaultValue;
      } else {
        throw new Error(
          `Input required for '${variable}' but running in non-interactive mode. ` +
          `Provide a default value or use --input ${variable}=value`
        );
      }
    }

    // Interactive input based on type
    switch (type) {
      case 'text':
        return this.promptText(prompt, defaultValue);
      case 'password':
        return this.promptPassword(prompt, defaultValue);
      case 'confirm':
        return this.promptConfirm(prompt, defaultValue);
      case 'select':
        return this.promptSelect(prompt, options, defaultValue);
      default:
        throw new Error(`Unknown input type: ${type}`);
    }
  }

  async promptText(prompt, defaultValue) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = promisify(rl.question).bind(rl);
    
    try {
      const displayPrompt = defaultValue ? 
        `${chalk.cyan(prompt)} ${chalk.gray(`[${defaultValue}]`)}: ` :
        `${chalk.cyan(prompt)} `;
      
      const answer = await question(displayPrompt);
      return answer.trim() || defaultValue || '';
    } finally {
      rl.close();
    }
  }

  async promptPassword(prompt, defaultValue) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const displayPrompt = defaultValue ? 
        `${chalk.cyan(prompt)} ${chalk.gray(`[***]`)}: ` :
        `${chalk.cyan(prompt)} `;
      
      rl.question(displayPrompt, (answer) => {
        rl.close();
        resolve(answer || defaultValue || '');
      });

      // Hide input for password
      rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (stringToWrite.includes(displayPrompt)) {
          rl.output.write(stringToWrite);
        } else {
          rl.output.write('*');
        }
      };
    });
  }

  async promptConfirm(prompt, defaultValue) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = promisify(rl.question).bind(rl);
    
    try {
      const defaultIndicator = defaultValue === 'yes' ? 'Y/n' : 
                               defaultValue === 'no' ? 'y/N' : 'y/n';
      const displayPrompt = `${chalk.cyan(prompt)} ${chalk.gray(`[${defaultIndicator}]`)}: `;
      
      const answer = await question(displayPrompt);
      rl.close();
      
      const normalizedAnswer = answer.trim().toLowerCase();
      
      if (!normalizedAnswer && defaultValue) {
        return defaultValue;
      }
      
      if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
        return 'yes';
      } else if (normalizedAnswer === 'n' || normalizedAnswer === 'no') {
        return 'no';
      } else {
        // Invalid input, ask again
        console.log(chalk.yellow('Please answer yes or no.'));
        return this.promptConfirm(prompt, defaultValue);
      }
    } finally {
      if (rl.terminal) {
        rl.close();
      }
    }
  }

  async promptSelect(prompt, options, defaultValue) {
    if (!options || options.length === 0) {
      throw new Error('Select input requires options');
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = promisify(rl.question).bind(rl);
    
    try {
      // Display options
      console.log(chalk.cyan(prompt));
      options.forEach((option, index) => {
        const isDefault = option === defaultValue;
        const prefix = isDefault ? chalk.green('→') : ' ';
        console.log(`  ${prefix} ${index + 1}. ${option} ${isDefault ? chalk.gray('(default)') : ''}`);
      });
      
      const displayPrompt = defaultValue ? 
        `${chalk.cyan('Enter choice')} ${chalk.gray(`[${options.indexOf(defaultValue) + 1}]`)}: ` :
        `${chalk.cyan('Enter choice')}: `;
      
      const answer = await question(displayPrompt);
      const choice = answer.trim();
      
      // Handle default
      if (!choice && defaultValue) {
        return defaultValue;
      }
      
      // Handle numeric choice
      const choiceNum = parseInt(choice);
      if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= options.length) {
        return options[choiceNum - 1];
      }
      
      // Handle text choice
      if (options.includes(choice)) {
        return choice;
      }
      
      // Invalid choice
      console.log(chalk.yellow('Invalid choice. Please try again.'));
      return this.promptSelect(prompt, options, defaultValue);
    } finally {
      rl.close();
    }
  }

  parseOverrides(overrideArray) {
    const map = new Map();
    for (const override of overrideArray) {
      const [key, ...valueParts] = override.split('=');
      const value = valueParts.join('='); // Handle values with = in them
      if (key && value) {
        map.set(key, value);
      } else {
        console.warn(chalk.yellow(`Invalid override format: ${override}. Use key=value`));
      }
    }
    return map;
  }
}