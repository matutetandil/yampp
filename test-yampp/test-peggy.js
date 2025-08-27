import { Parser as OldParser } from '../lib/parser.js';
import { Parser as PeggyParser } from '../lib/parser-peggy.js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

const testFiles = [
  'MinimalYamfile',
  'TestYamfile'
];

console.log(chalk.bold.blue('\n=== Testing Peggy Parser vs Old Regex Parser ===\n'));

for (const filename of testFiles) {
  console.log(chalk.yellow(`\nTesting ${filename}:`));
  console.log(chalk.gray('─'.repeat(50)));
  
  try {
    const content = readFileSync(filename, 'utf-8');
    
    // Test old parser
    console.log(chalk.cyan('\nOld Parser (Regex):'));
    const oldParser = new OldParser();
    let oldResult;
    try {
      oldResult = oldParser.parse(content);
      console.log(chalk.green(`✓ Parsed successfully`));
      console.log(`  Tasks: ${Array.from(oldResult.tasks.keys()).join(', ')}`);
      console.log(`  Variables: ${Array.from(oldResult.globalVariables.keys()).join(', ') || 'none'}`);
      console.log(`  Constants: ${Array.from(oldResult.globalConstants.keys()).join(', ') || 'none'}`);
    } catch (error) {
      console.log(chalk.red(`✗ Parse error: ${error.message}`));
    }
    
    // Test Peggy parser
    console.log(chalk.cyan('\nPeggy Parser:'));
    const peggyParser = new PeggyParser();
    let peggyResult;
    try {
      peggyResult = peggyParser.parse(content);
      console.log(chalk.green(`✓ Parsed successfully`));
      console.log(`  Tasks: ${Array.from(peggyResult.tasks.keys()).join(', ')}`);
      console.log(`  Variables: ${Array.from(peggyResult.globalVariables.keys()).join(', ') || 'none'}`);
      console.log(`  Constants: ${Array.from(peggyResult.globalConstants.keys()).join(', ') || 'none'}`);
    } catch (error) {
      console.log(chalk.red(`✗ Parse error: ${error.message}`));
      if (error.location) {
        console.log(chalk.gray(`  at line ${error.location.start.line}, column ${error.location.start.column}`));
      }
    }
    
    // Compare results if both parsed successfully
    if (oldResult && peggyResult) {
      console.log(chalk.magenta('\nComparison:'));
      
      const oldTasks = Array.from(oldResult.tasks.keys()).sort();
      const peggyTasks = Array.from(peggyResult.tasks.keys()).sort();
      
      if (JSON.stringify(oldTasks) === JSON.stringify(peggyTasks)) {
        console.log(chalk.green('✓ Task names match!'));
      } else {
        console.log(chalk.red('✗ Task names differ!'));
        console.log(`  Old: ${oldTasks.join(', ')}`);
        console.log(`  Peggy: ${peggyTasks.join(', ')}`);
      }
      
      // Check task details for one task
      const testTaskName = oldTasks[0];
      if (testTaskName) {
        const oldTask = oldResult.tasks.get(testTaskName);
        const peggyTask = peggyResult.tasks.get(testTaskName);
        
        console.log(chalk.cyan(`\nTask '${testTaskName}' details:`));
        console.log(`  Modifiers match: ${JSON.stringify(oldTask.modifiers) === JSON.stringify(peggyTask.modifiers) ? '✓' : '✗'}`);
        console.log(`  Dependencies match: ${JSON.stringify(oldTask.dependencies) === JSON.stringify(peggyTask.dependencies) ? '✓' : '✗'}`);
        console.log(`  Parameters match: ${JSON.stringify(oldTask.parameters) === JSON.stringify(peggyTask.parameters) ? '✓' : '✗'}`);
        console.log(`  Watched files match: ${JSON.stringify(oldTask.watchedFiles) === JSON.stringify(peggyTask.watchedFiles) ? '✓' : '✗'}`);
      }
    }
    
  } catch (error) {
    console.log(chalk.red(`Error reading file: ${error.message}`));
  }
}

console.log(chalk.bold.green('\n=== Test Complete ===\n'));