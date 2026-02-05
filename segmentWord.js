#!/usr/bin/env node
import { readFileSync } from 'fs';
import { findSyllableBoundaries } from './tone-tool.js';

const args = process.argv.slice(2);

const isInteractive = process.stdin.isTTY;
if (args.includes('--help') || (args.length === 0 && isInteractive)) {
  console.log('segmentWord - Segment a Pinyin word into syllables');
  console.log('');
  console.log('Usage: segmentWord [options] [inputfile]');
  console.log('');
  console.log('Options:');
  console.log('  -v, --verbose   Show boundaries and syllables on separate lines');
  console.log('  -j, --json      Output raw JSON boundaries');
  console.log('');
  console.log('Examples:');
  console.log('  segmentWord input.txt');
  console.log('  echo "ni3hao3" | segmentWord');
  console.log('  echo "ni3hao3" | segmentWord -v');
  console.log('  echo "ni3hao3" | segmentWord -j');
  process.exit(args.includes('--help') ? 0 : 1);
}

let text = '';

const inputFile = args.filter(arg => !arg.startsWith('-')).pop();

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
      const boundaries = findSyllableBoundaries(text);

      // If --json or -j flag is provided, show raw JSON
      if (args.includes('--json') || args.includes('-j')) {
        console.log(JSON.stringify(boundaries, null, 2));
      } else if (args.includes('--verbose') || args.includes('-v')) {
        // Default: show both boundaries and actual syllables
        const syllables = boundaries.map(b => text.slice(b.start, b.end));
        console.log('Boundaries:', JSON.stringify(boundaries));
        console.log('Syllables:', syllables.join(' '));
        if (boundaries.length > 0) {
          const lastEnd = boundaries[boundaries.length - 1].end;
        }
      } else {
        console.log(boundaries.map(b => text.slice(b.start, b.end)).join(' '));
      }
    });
  }
