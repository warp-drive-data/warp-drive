#!/usr/bin/env node

/**
 * Babel AST Parser for analyzing JavaScript files
 * Extracts and counts literal values and identifiers
 */

const fs = require('fs');
const path = require('path');

// Try to require babel parser, with fallback instructions
let parser;
try {
  parser = require('@babel/parser');
} catch (error) {
  console.error('Error: @babel/parser is not installed.');
  console.error('Please run: npm install @babel/parser @babel/traverse');
  process.exit(1);
}

let traverse;
try {
  traverse = require('@babel/traverse').default;
} catch (error) {
  console.error('Error: @babel/traverse is not installed.');
  console.error('Please run: npm install @babel/parser @babel/traverse');
  process.exit(1);
}

class ASTAnalyzer {
  constructor() {
    this.identifiers = new Map();
    this.literals = new Map();
    this.stringLiterals = new Map();
    this.numericLiterals = new Map();
    this.booleanLiterals = new Map();
    this.nullLiterals = 0;
    this.undefinedLiterals = 0;
    this.stats = {
      totalNodes: 0,
      totalIdentifiers: 0,
      totalLiterals: 0,
      uniqueIdentifiers: 0,
      uniqueLiterals: 0,
      totalFileSize: 0,
    };
  }

  analyze(filePath) {
    console.log(`Analyzing file: ${filePath}`);
    console.log('='.repeat(50));

    let code;
    try {
      code = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      return;
    }

    console.log(`File size: ${(code.length / 1024).toFixed(2)} KB`);
    console.log(`Line count: ${code.split('\n').length}`);
    console.log();

    this.stats.totalFileSize = code.length;

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining',
        ],
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
      });
    } catch (error) {
      console.error(`Error parsing file: ${error.message}`);
      return;
    }

    this.traverseAST(ast);
    this.printResults();
  }

  traverseAST(ast) {
    const self = this;

    traverse(ast, {
      enter(path) {
        self.stats.totalNodes++;

        // Count identifiers
        if (path.isIdentifier()) {
          const name = path.node.name;
          // Skip identifiers that are property keys in object expressions
          // and member expression properties (to avoid counting 'foo' in obj.foo twice)
          if (
            !path.isObjectProperty() &&
            !(path.isMemberExpression() && path.node === path.parent.property && !path.parent.computed)
          ) {
            self.identifiers.set(name, (self.identifiers.get(name) || 0) + 1);
            self.stats.totalIdentifiers++;
          }
        }

        // Count literals
        else if (path.isLiteral()) {
          const value = path.node.value;
          const key = JSON.stringify(value);

          self.literals.set(key, (self.literals.get(key) || 0) + 1);
          self.stats.totalLiterals++;

          // Categorize by type
          if (typeof value === 'string') {
            self.stringLiterals.set(value, (self.stringLiterals.get(value) || 0) + 1);
          } else if (typeof value === 'number') {
            self.numericLiterals.set(value, (self.numericLiterals.get(value) || 0) + 1);
          } else if (typeof value === 'boolean') {
            self.booleanLiterals.set(value, (self.booleanLiterals.get(value) || 0) + 1);
          } else if (value === null) {
            self.nullLiterals++;
          }
        }

        // Count undefined (which is an identifier, not a literal)
        else if (path.isIdentifier() && path.node.name === 'undefined') {
          self.undefinedLiterals++;
        }
      },
    });

    this.stats.uniqueIdentifiers = this.identifiers.size;
    this.stats.uniqueLiterals = this.literals.size;
  }

  printResults() {
    console.log('ANALYSIS RESULTS');
    console.log('='.repeat(50));
    console.log(`Total AST nodes: ${this.stats.totalNodes.toLocaleString()}`);
    console.log(`Total identifiers: ${this.stats.totalIdentifiers.toLocaleString()}`);
    console.log(`Unique identifiers: ${this.stats.uniqueIdentifiers.toLocaleString()}`);
    console.log(`Total literals: ${this.stats.totalLiterals.toLocaleString()}`);
    console.log(`Unique literals: ${this.stats.uniqueLiterals.toLocaleString()}`);
    console.log();

    // Top identifiers
    console.log('TOP 50 MOST FREQUENT IDENTIFIERS:');
    console.log('-'.repeat(40));
    const sortedIdentifiers = Array.from(this.identifiers.entries())
      .filter(([name]) => name.length > 2) // Ignore 1 and 2 char identifiers
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    sortedIdentifiers.forEach(([name, count], index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}: ${name.padEnd(20)} ${count.toString().padStart(4)} occurrences`
      );
    });
    console.log();

    // Top string literals
    console.log('TOP 50 MOST FREQUENT STRING LITERALS:');
    console.log('-'.repeat(40));
    const sortedStrings = Array.from(this.stringLiterals.entries())
      .filter(([str]) => str.length > 2) // Ignore 1 and 2 char strings
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    sortedStrings.forEach(([str, count], index) => {
      const truncated = str.length > 30 ? str.substring(0, 27) + '...' : str;
      console.log(
        `${(index + 1).toString().padStart(2)}: "${truncated.padEnd(30)}" ${count.toString().padStart(4)} occurrences`
      );
    });
    console.log();

    // Top numeric literals
    console.log('TOP 10 MOST FREQUENT NUMERIC LITERALS:');
    console.log('-'.repeat(40));
    const sortedNumbers = Array.from(this.numericLiterals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedNumbers.forEach(([num, count], index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}: ${num.toString().padEnd(10)} ${count.toString().padStart(4)} occurrences`
      );
    });
    console.log();

    // Boolean and null/undefined
    console.log('BOOLEAN, NULL, AND UNDEFINED LITERALS:');
    console.log('-'.repeat(40));
    this.booleanLiterals.forEach((count, value) => {
      console.log(`${value.toString().padEnd(10)} ${count.toString().padStart(4)} occurrences`);
    });
    console.log(`null${' '.repeat(6)} ${this.nullLiterals.toString().padStart(4)} occurrences`);
    console.log(`undefined${' '.repeat(1)} ${this.undefinedLiterals.toString().padStart(4)} occurrences`);
    console.log();

    // Identifier length distribution
    console.log('IDENTIFIER LENGTH DISTRIBUTION:');
    console.log('-'.repeat(40));
    const lengthDist = new Map();
    this.identifiers.forEach((count, name) => {
      const len = name.length;
      lengthDist.set(len, (lengthDist.get(len) || 0) + count);
    });

    Array.from(lengthDist.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([length, count]) => {
        console.log(`Length ${length.toString().padStart(2)}: ${count.toString().padStart(5)} identifiers`);
      });
    console.log();

    // Single character identifiers (minified code indicator)
    console.log('SINGLE CHARACTER IDENTIFIERS (minification indicator):');
    console.log('-'.repeat(40));
    const singleChar = Array.from(this.identifiers.entries())
      .filter(([name]) => name.length === 1)
      .sort((a, b) => b[1] - a[1]);

    if (singleChar.length > 0) {
      singleChar.slice(0, 10).forEach(([name, count]) => {
        console.log(`"${name}": ${count} occurrences`);
      });
      console.log(`Total single-char identifiers: ${singleChar.length}`);
    } else {
      console.log('No single character identifiers found');
    }
    console.log();

    const TOP_COUNT = 100;
    // Top N longest string literals
    console.log(`TOP ${TOP_COUNT} LONGEST STRING LITERALS:`);
    console.log('-'.repeat(40));
    const longestStrings = Array.from(this.stringLiterals.entries())
      .sort((a, b) => b[0].length - a[0].length)
      .slice(0, TOP_COUNT);

    let totalBytesTopN = 0;
    longestStrings.forEach(([str, count], index) => {
      const displayStr = str.length > 60 ? str.substring(0, 57) + '...' : str;
      const bytesForThisString = str.length * count;
      totalBytesTopN += bytesForThisString;
      console.log(
        `${(index + 1).toString().padStart(2)}: (${str.length.toString().padStart(3)} chars) "${displayStr}" (${count}x) = ${bytesForThisString} bytes`
      );
    });

    console.log('-'.repeat(40));
    console.log(`Total bytes for top ${TOP_COUNT} longest strings: ${totalBytesTopN.toLocaleString()} bytes`);
    console.log(
      `Percentage of total file size: ${((totalBytesTopN / (this.stats.totalFileSize || 1)) * 100).toFixed(2)}%`
    );
    console.log();

    // Top N longest identifier names
    console.log(`TOP ${TOP_COUNT} LONGEST IDENTIFIER NAMES:`);
    console.log('-'.repeat(40));
    const longestIdentifiers = Array.from(this.identifiers.entries())
      .sort((a, b) => b[0].length - a[0].length)
      .slice(0, TOP_COUNT);

    let totalBytesTopNIdentifiers = 0;
    longestIdentifiers.forEach(([name, count], index) => {
      const bytesForThisIdentifier = name.length * count;
      totalBytesTopNIdentifiers += bytesForThisIdentifier;
      console.log(
        `${(index + 1).toString().padStart(2)}: (${name.length.toString().padStart(3)} chars) ${name} (${count}x) = ${bytesForThisIdentifier} bytes`
      );
    });

    console.log('-'.repeat(40));
    console.log(
      `Total bytes for top ${TOP_COUNT} longest identifiers: ${totalBytesTopNIdentifiers.toLocaleString()} bytes`
    );
    console.log(
      `Percentage of total file size: ${((totalBytesTopNIdentifiers / (this.stats.totalFileSize || 1)) * 100).toFixed(2)}%`
    );
    console.log();

    // Summary insights
    console.log('INSIGHTS:');
    console.log('-'.repeat(40));
    const singleCharCount = singleChar.length;
    const avgIdentifierLength =
      Array.from(this.identifiers.keys()).reduce((sum, name) => sum + name.length, 0) / this.identifiers.size;

    console.log(`Average identifier length: ${avgIdentifierLength.toFixed(2)} characters`);
    console.log(
      `Single-char identifiers: ${singleCharCount} (${((singleCharCount / this.stats.uniqueIdentifiers) * 100).toFixed(1)}%)`
    );

    if (singleCharCount > this.stats.uniqueIdentifiers * 0.1) {
      console.log('✅  High ratio of single-character identifiers suggests minified code');
    }

    if (this.stats.totalNodes > 10000) {
      console.log('⚠️  Large number of AST nodes suggests complex bundled code');
    }

    console.log();
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node ast-analyzer.js <path-to-js-file>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const analyzer = new ASTAnalyzer();
  analyzer.analyze(filePath);
}

if (require.main === module) {
  main();
}

module.exports = ASTAnalyzer;
