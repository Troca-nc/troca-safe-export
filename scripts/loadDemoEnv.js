const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const output = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

function loadEnvFile(filePath, options = {}) {
  const { override = false } = options;
  const env = parseEnvFile(filePath);

  for (const [key, value] of Object.entries(env)) {
    if (!override && Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    process.env[key] = value;
  }

  return env;
}

function loadDemoEnv() {
  const root = path.resolve(__dirname, '..');
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.demo'), { override: true });
}

module.exports = {
  loadDemoEnv,
  loadEnvFile,
  parseEnvFile,
};
