'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const sourceRoot = path.join(__dirname, '..');

function javascriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'tests' ? [] : javascriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

describe('Pro public projection boundary', () => {
  it('ne considère jamais une échéance Pro absente comme un droit actif', () => {
    const permissiveExpiry = /pro_expires_at\s+IS\s+NULL\s+OR\s+[a-z.]*pro_expires_at\s*>\s*NOW\(\)/i;
    const offenders = javascriptFiles(sourceRoot)
      .filter((file) => permissiveExpiry.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(sourceRoot, file));

    assert.deepStrictEqual(offenders, []);
  });
});
