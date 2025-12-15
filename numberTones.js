#!/usr/bin/env node
import { readFileSync } from 'fs';
import { toToneNumbers } from './tone-tool.js';

const args = process.argv.slice(2);

const isInteractive = process.stdin.isTTY;
if (args.includes('--help') || (args.length === 0 && isInteractive)) {
  console.log('numberTones - Convert Pinyin with tone marks to tone numbers');
  console.log('');
  console.log('Usage: numberTones [inputfile]');
  console.log('');
  console.log('Examples:');
  console.log('  numberTones input.txt');
  console.log('  echo "nǐhǎo" | numberTones');
  process.exit(args.includes('--help') ? 0 : 1);
}

let text = '';

const inputFile = args.filter(arg => !arg.startsWith('--')).pop();

if (inputFile) {
  try {
    text = readFileSync(inputFile, 'utf8');
  } catch (err) {
    console.error(`Error reading file "${inputFile}": ${err.message}`);
    process.exit(1);
  }
} else {
  // If no file is provided, read from stdin
  const chunks = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    text = chunks.join('');
    console.log(toToneNumbers(text, {}));
  });
}
