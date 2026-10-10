// Owns checksum-verified local copies of hosted art and excludes them from production output.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const isBinary = path => /\.(glb|jpg|png)$/.test(path);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function validateManifest(manifest) {
  if (manifest.version !== 1 || !/^https:\/\//.test(manifest.baseUrl) || !Array.isArray(manifest.files)) {
    throw new Error('Invalid runtime asset manifest');
  }
  const paths = new Set();
  for (const file of manifest.files) {
    if (!/^public\/(models|materials)\/[a-zA-Z0-9_.\/-]+$/.test(file.path)
      || file.path.split('/').some(part => part === '..' || part === '.')
      || file.key !== file.path.slice('public/'.length)
      || !Number.isSafeInteger(file.bytes) || file.bytes < 0
      || !/^[a-f0-9]{64}$/.test(file.sha256) || paths.has(file.path)) {
      throw new Error(`Invalid runtime asset entry: ${file.path}`);
    }
    paths.add(file.path);
  }
  return manifest;
}

function matches(bytes, file) {
  return bytes.byteLength === file.bytes && sha256(bytes) === file.sha256;
}

export async function materializeRuntimeAssets(manifest, { root = repositoryRoot, download = false, fetcher = fetch } = {}) {
  validateManifest(manifest);
  let verified = 0;
  let downloaded = 0;
  for (const file of manifest.files) {
    const destination = resolve(root, file.path);
    const existing = await readFile(destination).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (existing && matches(existing, file)) {
      verified++;
      continue;
    }
    if (!download) throw new Error(`Missing or checksum-mismatched ${file.path}; run npm run assets:fetch`);
    const response = await fetcher(`${manifest.baseUrl.replace(/\/+$/, '')}/${file.key}`, {
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`Asset fetch failed (${response.status}): ${file.key}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!matches(bytes, file)) throw new Error(`Downloaded asset checksum mismatch: ${file.key}`);
    await mkdir(dirname(destination), { recursive: true });
    const temporary = `${destination}.${process.pid}.download`;
    try {
      await writeFile(temporary, bytes);
      await rename(temporary, destination);
    } finally {
      await rm(temporary, { force: true });
    }
    downloaded++;
    verified++;
  }
  return { verified, downloaded };
}

export async function pruneHostedBuildAssets(manifest, { root = repositoryRoot } = {}) {
  validateManifest(manifest);
  let removed = 0;
  for (const file of manifest.files.filter(file => isBinary(file.path))) {
    await rm(resolve(root, 'dist', file.key), { force: true });
    removed++;
  }
  return { removed };
}

async function main() {
  const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'runtime-assets.json'), 'utf8'));
  const command = process.argv[2];
  if (command === 'prune-build') {
    const { removed } = await pruneHostedBuildAssets(manifest);
    console.info(`Excluded ${removed} hosted runtime binaries from dist; attribution and metadata retained.`);
    return;
  }
  if (command !== 'fetch' && command !== 'verify') throw new Error('Use fetch, verify, or prune-build');
  const result = await materializeRuntimeAssets(manifest, { download: command === 'fetch' });
  console.info(`Verified ${result.verified} runtime files (${result.downloaded} downloaded).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
