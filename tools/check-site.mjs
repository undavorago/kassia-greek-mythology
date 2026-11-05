import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const visited = new Set();
let references = 0;

async function inspect(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const text = await readFile(file, 'utf8');
  const ext = path.extname(file);
  const values = ext === '.css'
    ? [...text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(m => m[1])
    : [...text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
  for (const value of values) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) continue;
    const clean = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!clean) continue;
    let target = value.startsWith('/')
      ? path.resolve(root, '.' + clean)
      : path.resolve(path.dirname(file), clean);
    if (target !== root && !target.startsWith(root + path.sep)) {
      errors.push(`${path.relative(root, file)}: outside project: ${value}`);
      continue;
    }
    try {
      let info = await stat(target);
      if (info.isDirectory()) { target = path.join(target, 'index.html'); info = await stat(target); }
      if (!info.isFile()) throw new Error('Not a file');
      references++;
      if (['.css', '.html'].includes(path.extname(target))) await inspect(target);
    } catch {
      errors.push(`${path.relative(root, file)}: missing ${value}`);
    }
  }
}

for (const name of await readdir(root)) {
  if (name.endsWith('.html')) await inspect(path.join(root, name));
}
for (const name of await readdir(path.join(root, 'lectures'))) {
  if (name.endsWith('.html')) await inspect(path.join(root, 'lectures', name));
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${visited.size} HTML/CSS files and ${references} local references; no missing files.`);
}
