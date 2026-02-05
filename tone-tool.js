// Pinyin tone conversion tools
// Constants at top of file, then helpers and then finally primary utilities
// Primary utilities: toToneMarks, toToneNumbers
// Both are heavily tested, but toToneNumbers is partially AI-generated
// toToneMarks is partially modernized from an ancient, battle-tested version
//
// Copyright Mark Wilbur, MIT License

// ----- Global Constants -----

const toneMarkTable = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
  A: ["Ā", "Á", "Ǎ", "À"],
  E: ["Ē", "É", "Ě", "È"],
  I: ["Ī", "Í", "Ǐ", "Ì"],
  O: ["Ō", "Ó", "Ǒ", "Ò"],
  U: ["Ū", "Ú", "Ǔ", "Ù"],
  //                        space for readability
  "Ü": ["Ǖ", "Ǘ", "Ǚ", "Ǜ"],
}

const toneMarkedToBase = {};
for (const [baseVowel, toneMarks] of Object.entries(toneMarkTable)) {
  toneMarks.forEach((toneMark, index) => {
    toneMarkedToBase[toneMark] = baseVowel.toLowerCase();
  });
}

const vowelSet = new Set(['a', 'e', 'i', 'o', 'u', 'v', 'ü', 'A', 'E', 'I', 'O', 'U', 'V', 'Ü']);
const umlatu = "ü";
const capUmlatu = "Ü";

// Character class definitions
const toneMarkedVowels = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ';
const vowels = `aeiouvüAEIOUVÜ${toneMarkedVowels}`;
const consonants = 'bpmfdtnlgkhjqxrzcsyw';

// Specific character classes for common patterns
const basicVowels = 'aeiouvüAEIOUVÜ';
const aoeVowels = 'aoeāáǎàēéěèōóǒò';
const consonantsEnding = 'bcdfghjklmnpqrstvwxyz';
const vowelsWithNG = 'aeiouvüngrAEIOUVÜNGR';

// Pre-compiled regex patterns
// Use Unicode-aware letters + digits plus explicit tone-marked vowels.
const wordSplitPattern = new RegExp(`(\\s+|[^\\p{L}\\p{N}${toneMarkedVowels}]+)`, 'u');
const wordPattern = new RegExp(`^[\\p{L}\\p{N}${toneMarkedVowels}]+$`, 'iu');


// ----- Helper Utilities -----

function buildSyllablePattern() {
  // assumes tone marks are stripped
  return new RegExp(
    // Optional initial (including r, zh, ch, sh)
    `(?:zh|ch|sh|[${consonants}])?` +
    // Optional medial: only plain i/u/ü/v (tone marks never sit on the medial)
    `(?:[iuvüIUVÜ])?` +
    // Final (required): try longer, more complex finals first
    `(?:` +
    // Standalone "er" syllable: allowed only when the preceding character is NOT a vowel
    `(?<![${vowels}])er|` +
    `(?:iang|iong|uang|ueng|ian|iao|ing|ong|ang|eng|ai|ao|ei|ou)|` +
    // Simpler compound finals, but don't absorb n/ng when a vowel follows (so "qiènuò" splits as "qiè" + "nuò")
    `(?:[${vowels}](?:ng(?![${vowels}])|n(?![${vowels}])))|` +
    // Finals ending in i/o/u (e.g. "ui", "ou", etc.)
    `(?:[${vowels}](?:i|o|u))|` +
    // Single-vowel finals
    `(?:[${vowels}])` +
    `)` +
    // Erhua: r that is NOT followed by a vowel character; if a vowel follows, r is the next syllable's initial
    `(?:r(?![${vowels}]))?`,
    'gi'
  );
}

const toneMarkedToNumber = {};
for (const [baseVowel, toneMarks] of Object.entries(toneMarkTable)) {
  toneMarks.forEach((toneMark, index) => {
    toneMarkedToNumber[toneMark] = index + 1; // 1-4 for tones
  });
}

function applyToneToVowel(charInWord, toneNum) {
  const char = convertToUmlautIfV(charInWord);
  if (toneNum <= 4) { return toneMarkTable[char][toneNum - 1]; }
  return char;
}

function convertToUmlautIfV(char) {
  if (char === "v") return umlatu;
  if (char === "V") return capUmlatu;
  return char;
}

function stripTonesAndLowercase(text) {
  return text.split('').map(char => {
    if (toneMarkedToBase[char]) { return toneMarkedToBase[char]; }
    return char.toLowerCase();
  }).join('');
}

// Determines syllable boundaries using pinyin orthography rules
function findSyllableBoundaries(text) {
  const normalizedText = stripTonesAndLowercase(text);
  const boundaries = [];
  const syllablePattern = buildSyllablePattern();

  let match;
  while ((match = syllablePattern.exec(normalizedText)) !== null) {
    boundaries.push({ start: match.index, end: match.index + match[0].length });
  }

  const processedBoundaries = [];
  for (let i = 0; i < boundaries.length; i++) {
    const current = boundaries[i];
    const next = boundaries[i + 1];

    processedBoundaries.push(current);

    // check if next syllable starts with a/o/e and should be separated
    if (next) {
      const currentSyllable = normalizedText.slice(current.start, current.end);
      const currentEndsWithConsonant = new RegExp(`[${consonantsEnding}]$`, 'i').test(currentSyllable);

      const nextSyllable = normalizedText.slice(next.start, next.end);
      const nextStartsWithAOE = new RegExp(`^[${aoeVowels}]`, 'i').test(nextSyllable);
      const nextStartsWithVowel = new RegExp(`^[${vowels}]`, 'i').test(nextSyllable);

      // check if there's already an apostrophe between syllables
      const hasApostrophe = normalizedText.slice(current.end, next.start).includes("'");

      const gap = normalizedText.slice(current.end, next.start);
      const hasNoGap = gap.length === 0;
      const ngFollowedByVowel = currentSyllable.endsWith('ng') && nextStartsWithVowel;
      if (hasNoGap && (nextStartsWithAOE || ngFollowedByVowel)) {
        if (currentSyllable.length > 1 && currentEndsWithConsonant) {
          // Adjust current boundary to exclude the last consonant
          processedBoundaries[processedBoundaries.length - 1] = {
            start: current.start,
            end: current.end - 1
          };
          // Adjust next boundary to include the consonant
          boundaries[i + 1] = {
            start: next.start - 1,
            end: next.end
          };
        }
      }
    }
  }
  return processedBoundaries;
}

function extractToneNumber(syllable) {
  for (const char of syllable) {
    if (toneMarkedToNumber[char]) {
      return toneMarkedToNumber[char];
    }
  }
  // Treat no tone mark as neutral tone
  return 5;
}

// strips tone marks from a syllable while preserving capitalization
function stripToneFromSyllable(syllable) {
  return syllable.split('').map(char => {
    if (toneMarkedToBase[char]) {
      return toneMarkedToBase[char];
    }
    return char;
  }).join('');
}

// Does rough check of if a word is clearly non-Pinyin
function isNonPinyinWord(word) {
  const boundaries = findSyllableBoundaries(word);

  // If no syllables were found, it's not pinyin
  if (boundaries.length === 0) { return true; }

  const totalSyllableLength =
    boundaries.reduce((sum, b) => sum + (b.end - b.start), 0);

  // If the syllables don't cover the entire word, it's not pinyin
  if (totalSyllableLength < word.length) { return true; }

  return false;
}

// ----- Primary Utilities -----

function toToneMarks(inputText, options = {}) {
  const { apostrophes = true } = options;
  let outputText = "";
  let currentWord = "";
  let currentChar = "";
  let i = 0;
  let foundVowels = 0;

  for (i = 0; i <= inputText.length; i++) {
    currentChar = inputText.charAt(i);

    // numbers 1-5 are tone marks, build the word until we hit one
    if (!(currentChar.match(/[1-5]/))) {
      if (vowelSet.has(currentChar)) foundVowels++;
      // if the last character was a vowel and this isn't...
      if (foundVowels !== 0 && currentChar.match(new RegExp(`[^${vowelsWithNG}]`, 'i')) || currentChar === "") {
        outputText += currentWord;
        currentWord = currentChar;
      }
      else { currentWord += currentChar; }
    }
    // the character matched 1-5, treat as a tone mark
    else {
      let toneNum = Number(currentChar);
      let wordLen = currentWord.length;
      foundVowels = 0;
      let useVowel = 1; // 1st or 2nd vowel will get the tone mark
      // step through each character in word

      // If it doesn't have vowels, just output it
      if (!currentWord.match(new RegExp(`[${basicVowels}]`, 'i'))) {
        outputText += (currentWord + currentChar);
        currentWord = "";
      }

      // the tone goes over the second vowel for these combinations
      if (currentWord.match(/i[aeou]/i)) useVowel = 2;
      if (currentWord.match(/u[aeio]/i)) useVowel = 2;
      if (currentWord.match(/[vü]e/i)) useVowel = 2;

      // add apostrophes before 2nd or later syllables starting with a, e and o
      if (apostrophes) {
        const prevChar = outputText.slice(-1);
        if (prevChar.length > 0 && !prevChar.match(/[\s\-.,!?;:]/) && currentWord[0]?.match(new RegExp(`[${aoeVowels}]`, 'i'))) {
          outputText += "'";
        }
      }

      // We'll check either the first or the first two vowels, depending on which should have the tone
      for (let j = 0; j <= wordLen && foundVowels < useVowel; j++) {
        let tempWord = "";
        const charInWord = currentWord.charAt(j);
        if (vowelSet.has(charInWord)) {
          foundVowels++;
          const tonedChar = applyToneToVowel(charInWord, toneNum);

          if (foundVowels >= useVowel) {
            tempWord = Array.from(currentWord).map((char, k) => {
              if (k === j) return tonedChar;
              return convertToUmlautIfV(char);
            }).join('');
            currentWord = "";
          }
        }
        outputText += tempWord;
      }
    }
  }

  return outputText;
}

function toToneNumbers(text, options = {}) {
  if (!text) return text;
  const { erhuaTone = 'after-r', preserveApostrophes = false, showNeutralTone = true } = options;
  const words = text.split(wordSplitPattern);
  let pendingApostrophe = false;

  return words.map(word => {
    // Don't preserve apostrophes for tone numbered pinyin. Only preserve for non-pinyin
    if (!preserveApostrophes && (word === "'")) {
      pendingApostrophe = true;
      return "";
    }

    // Skip non-word characters (spaces, punctuation, etc.) and non-pinyin words
    if (!wordPattern.test(word)) { return word; }
    if (isNonPinyinWord(word)) { return word; }

    // Process as Pinyin word
    const boundaries = findSyllableBoundaries(word);
    let result = '';
    let lastBoundaryEnd = 0;

    for (const boundary of boundaries) {
      // Add any non-Pinyin text before this syllable (strip apostrophes)
      if (boundary.start > lastBoundaryEnd) {
        const gap = word.slice(lastBoundaryEnd, boundary.start);
        result += gap.replace(/'$/, '');
      }

      const syllable = word.slice(boundary.start, boundary.end);
      const toneNumber = extractToneNumber(syllable);
      const baseSyllable = stripToneFromSyllable(syllable);

      // Handle erhua tone placement
      if (baseSyllable.endsWith('r') && baseSyllable.length > 1) {
        const baseWithoutR = baseSyllable.slice(0, -1);

        if (erhuaTone === 'after-r') {
          result += baseWithoutR + 'r' + toneNumber;
        }
        else {
          result += baseWithoutR + toneNumber + 'r';
        }
      }
      // Regular syllable - add tone number at the end
      else { result += baseSyllable + toneNumber; }

      lastBoundaryEnd = boundary.end;
    }

    // Add any remaining non-Pinyin text
    if (lastBoundaryEnd < word.length) {
      result += word.slice(lastBoundaryEnd);
    }

    if (!showNeutralTone) {
      result = result.replace(/5/g, '');
    }

    return result;
  }).join('');
}

export {
  toToneMarks,
  toToneNumbers,
  isNonPinyinWord,
  toneMarkTable,
  vowelSet,
  stripTonesAndLowercase,
  findSyllableBoundaries,
  consonants,
  vowels,
};
