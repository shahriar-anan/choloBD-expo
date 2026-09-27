import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const SCAN_DIRS = ['src/services/api', 'src/store'].map((d) => path.join(repoRoot, d));

const BLOCKED = [
  '/api/trip-plans',
  '/tour-builder/by-admin/',
  '/activity-spots/location/',
  '/tour-spots/location/',
  '/api/v1/hotels/my-hotel',
  '/auth/oauth/callback',
  '/auth/oauth/validate',
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) files.push(full);
  }
  return files;
}

const hits = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const needle of BLOCKED) {
        if (line.includes(needle)) {
          hits.push(`${path.relative(repoRoot, file)}:${i + 1}: ${needle}`);
        }
      }
    }
  }
}

if (hits.length > 0) {
  console.error('Stale API path substrings found:\n' + hits.join('\n'));
  process.exit(1);
}

console.log('No stale API paths under src/services/api or src/store.');
