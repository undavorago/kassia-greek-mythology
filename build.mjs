import { copyFile, cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'catalog.html', 'preview.html', 'rules.html', '.nojekyll']) {
  await copyFile(path.join(root, name), path.join(out, name));
}
for (const name of ['assets', 'lectures']) {
  await cp(path.join(root, name), path.join(out, name), { recursive: true });
}
console.log('Static files copied to dist');
