#!/usr/bin/env node
import { readFileSync } from 'fs';
import { findSyllableBoundaries } from './tone-tool.js';

const args = process.argv.slice(2);

const isInteractive = process.stdin.isTTY;
if (args.includes('--help') || (args.length === 0 && isInteractive)) {
  console.log('segmentWord - Segment a Pinyin word into syllables');
  console.log('');
  console.log('Usage: segmentWord [inputfile]');
  console.log('');
  console.log('Examples:');
  console.log('  segmentWord input.txt');
  console.log('  echo "ni3hao3" | segmentWord');
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
    console.log(findSyllableBoundaries(text));
  });
}
