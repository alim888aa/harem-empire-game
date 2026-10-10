// Tests the public asset recovery interface using disposable files and an injected download transport.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materializeRuntimeAssets, pruneHostedBuildAssets, validateManifest } from '../scripts/runtime-assets.mjs';

const bytes = Buffer.from('exact reviewed art bytes');
const entry = { path: 'public/models/test.glb', key: 'models/test.glb', bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex') };
const manifest = { version: 1, baseUrl: 'https://example.test', files: [entry] };

test('local recovery verifies downloads and reuses only checksum-matching files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'empire-assets-'));
  let downloads = 0;
  try {
    const fetcher = async (url: string) => {
      assert.equal(url, 'https://example.test/models/test.glb');
      downloads++;
      return new Response(bytes);
    };
    assert.deepEqual(await materializeRuntimeAssets(manifest, { root, download: true, fetcher }),
      { verified: 1, downloaded: 1 });
    assert.deepEqual(await materializeRuntimeAssets(manifest, { root, download: true, fetcher }),
      { verified: 1, downloaded: 0 });
    assert.deepEqual(await materializeRuntimeAssets(manifest, { root }), { verified: 1, downloaded: 0 });
    assert.equal(downloads, 1);
    assert.deepEqual(await readFile(join(root, entry.path)), bytes);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('missing and mismatched local art fails verification instead of silently passing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'empire-assets-'));
  try {
    await assert.rejects(materializeRuntimeAssets(manifest, { root }), /assets:fetch/);
    await mkdir(join(root, 'public/models'), { recursive: true });
    await writeFile(join(root, entry.path), 'corrupt');
    await assert.rejects(materializeRuntimeAssets(manifest, { root }), /checksum-mismatched/);
    await assert.rejects(materializeRuntimeAssets(manifest, { root, download: true,
      fetcher: async () => new Response('wrong') }), /Downloaded asset checksum mismatch/);
    assert.equal(await readFile(join(root, entry.path), 'utf8'), 'corrupt');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('download HTTP failures are actionable and do not install a partial file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'empire-assets-'));
  try {
    await assert.rejects(materializeRuntimeAssets(manifest, { root, download: true,
      fetcher: async () => new Response('blocked', { status: 403 }) }), /403.*models\/test.glb/);
    await assert.rejects(readFile(join(root, entry.path)), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('manifest validation rejects traversal and duplicate entries before touching files', () => {
  assert.throws(() => validateManifest({ ...manifest, files: [{ ...entry, path: 'public/models/../../escape.glb' }] }));
  assert.throws(() => validateManifest({ ...manifest, files: [entry, entry] }));
});

test('production cleanup removes only hosted binaries and retains provenance and local test art', async () => {
  const root = await mkdtemp(join(tmpdir(), 'empire-assets-'));
  try {
    await mkdir(join(root, 'dist/models'), { recursive: true });
    await mkdir(join(root, 'public/models'), { recursive: true });
    await writeFile(join(root, 'dist/models/test.glb'), bytes);
    await writeFile(join(root, 'dist/models/provenance.json'), '{}');
    await writeFile(join(root, entry.path), bytes);
    assert.deepEqual(await pruneHostedBuildAssets(manifest, { root }), { removed: 1 });
    await assert.rejects(readFile(join(root, 'dist/models/test.glb')), { code: 'ENOENT' });
    assert.equal(await readFile(join(root, 'dist/models/provenance.json'), 'utf8'), '{}');
    assert.deepEqual(await readFile(join(root, entry.path)), bytes);
  } finally { await rm(root, { recursive: true, force: true }); }
});
