import peggy from 'peggy';
import { readFileSync } from 'fs';

const grammar = readFileSync('../lib/yamfile.pegjs', 'utf-8');
const parser = peggy.generate(grammar, { trace: false });
const content = readFileSync('TestYamfile', 'utf-8');

try {
  const result = parser.parse(content);
  console.log('Success!');
  console.log('Tasks found:', result.tasks.map(t => t.name));
} catch (error) {
  console.log('Error at line', error.location?.start?.line, 'column', error.location?.start?.column);
  console.log('Message:', error.message);
  
  // Show the problematic line
  const lines = content.split('\n');
  const lineNum = error.location?.start?.line - 1;
  if (lineNum >= 0 && lineNum < lines.length) {
    console.log('\nProblematic line:');
    console.log(`${lineNum + 1}: ${lines[lineNum]}`);
    console.log('   ' + ' '.repeat(error.location?.start?.column - 1) + '^');
  }
  
  // Show context
  console.log('\nContext:');
  for (let i = Math.max(0, lineNum - 2); i <= Math.min(lines.length - 1, lineNum + 2); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}