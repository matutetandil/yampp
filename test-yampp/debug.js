import { Parser } from '../lib/parser.js';
import { readFileSync } from 'fs';

const content = readFileSync('TestYamfile', 'utf-8');
const parser = new Parser();

console.log('Testing regex pattern...');
const pattern = /^\s*(?:((?:always|serial|critical)(?:\s*:\s*|\s+))*)?(\w+)(?:\s*\(([^)]*)\))?\s*(.*?)\{([^}]*)\}/gms;
const matches = [...content.matchAll(pattern)];
console.log('Found', matches.length, 'matches:');
matches.forEach((match, i) => {
  console.log(`Match ${i+1}:`);
  console.log(`  Group 1 (modifiers): '${match[1] || 'none'}'`);
  console.log(`  Group 2 (taskName): '${match[2] || 'none'}'`);
  console.log(`  Group 3 (params): '${match[3] || 'none'}'`);
  console.log(`  Group 4 (clauses): '${match[4] || 'none'}'`);
  console.log(`  Preview: ${match[0].substring(0, 50)}...`);
});

// Test with cleaned content
const cleanContent = parser.removeComments(content);
console.log('\n--- After comment removal ---');
const matches2 = [...cleanContent.matchAll(pattern)];
console.log('Found', matches2.length, 'matches:');
matches2.forEach((match, i) => {
  console.log(`Match ${i+1}: ${match[2]} (modifiers: '${match[1] || 'none'}')`);
});