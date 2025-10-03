# Pinyin Tone Tool

A lightweight Node.js utility for converting Pinyin with tone numbers to tone marks (and vice versa).

The tool provides two primary functions:

- Convert numeric tone representations to tone marks.
- Convert tone-marked Pinyin back to numeric representation.

For example:

- Converting `"ni3hao3"` yields `"nǐhǎo"`.
- Converting `"nǐhǎo"` yields `"ni3hao3"`.


## Features

- **Pinyin apostrophe rules applied:** Apostrophes are prepended to syllables starting with a, e or o except when following whitespace.
- **Capitalized letter support**: Tonemarks can be applied to capital letters.
- **Preserves non-pinyin input where possible:** Tone numbered pinyin within English text is handled gracefully in most cases.
- **Erhua Handling:** Supports different configurations for the erhua (`r`) tone attachment.
- **Allows v for ü:** Instances of v within pinyin syllables are converted to ü, as is common in IMEs.

Examples:

- "Chang2an1" -> "Cháng'ān"
- "Ai4er3lan2" -> "Ài'ěrlán"
- "yi1 hui3r" -> "yī huǐr".
- "lv4se4" -> "lǜsè"
- "The northeastern region of China has three provinces—Ji2lin2, Hei1long2jiang1, and Liao2ning2." -> "The northeastern region of China has three provinces—Jílín, Hēilóngjiāng, and Liáoníng."

## Installation

Clone or download the repository and then install dependencies:

```bash
git clone https://github.com/yourusername/pinyin-tone-tool.git
cd pinyin-tone-tool
npm install
```

If you plan to use it as a standalone tool, you can also install the module globally (if published to npm):

```bash
npm install -g pinyin-tone-tool
```

## Usage

You can use the tool programmatically by importing it into your Node.js projects:

```javascript
const { toToneMarks, toToneNumbers } = require('./tone-tool');

// Convert tone-numbers to tone-marks
const toneMarked = toToneMarks("ni3hao3");
console.log(toneMarked); // "nǐhǎo"

// Convert tone-marks back to tone-numbers
const toneNumbered = toToneNumbers("nǐhǎo");
console.log(toneNumbered); // "ni3hao3"
```

You can also use configuration options:

```javascript
// Convert with custom settings
const customConversion = toToneNumbers("huār", { erhuaTone: 'before-r', showNeutralTone: false });
console.log(customConversion); // "hua1r"
```

## Testing

This project uses [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/) for unit testing.

To run the tests, use the following command:

```bash
npm test
```

## Contributing

Contributions are welcome! Feel free to open issues, submit pull requests, or suggest improvements.  
Before contributing, please review our [contribution guidelines](CONTRIBUTING.md) (if available) and make sure your changes align with the project goals.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Based on the original Pinyin conversion projects.
- Inspired by the need for simple and lightweight Pinyin processing tools in JavaScript.

---

*Happy converting!*
