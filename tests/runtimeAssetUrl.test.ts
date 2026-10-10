// Verifies asset delivery at the public boundary without changing logical game asset identities.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { ModelAssetPool } from '../src/palace/assetPool';
import { RUNTIME_ASSET_BASE_URL, runtimeAssetUrl } from '../src/palace/runtimeAssetUrl';

test('model and material URLs retain their path and cache-busting query at the hosted origin', () => {
  assert.equal(runtimeAssetUrl('/models/emperor-runtime.glb?v=original'),
    `${RUNTIME_ASSET_BASE_URL}/models/emperor-runtime.glb?v=original`);
  assert.equal(runtimeAssetUrl('/materials/dark_wood_diff_1k.jpg'),
    `${RUNTIME_ASSET_BASE_URL}/materials/dark_wood_diff_1k.jpg`);
});

test('portraits, QA fixtures, metadata and already absolute URLs are unchanged', () => {
  for (const path of ['/portraits/player-prince.webp', '/qa/romance.json', '/models/emperor-manifest.json',
    'https://example.test/models/art.glb', 'blob:example']) {
    assert.equal(runtimeAssetUrl(path), path);
  }
});

test('explicit local mode and alternative delivery roots preserve asset identity', () => {
  const path = '/models/player-empress.glb?v=4dc2bc145556352c';
  assert.equal(runtimeAssetUrl(path, 'local'), path);
  assert.equal(runtimeAssetUrl(path, 'https://example.test/empire-game/'), `https://example.test/empire-game${path}`);
  assert.throws(() => runtimeAssetUrl(path, 'invalid'), /HTTP\(S\)/);
});

test('default pool fetch uses hosted delivery while leases, cache and decoder keep the logical model ID', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  const decoded: string[] = [];
  globalThis.fetch = async input => {
    requests.push(String(input));
    return new Response(new Uint8Array([1, 2, 3]));
  };
  try {
    const pool = new ModelAssetPool(100, undefined, async (_bytes, path) => {
      decoded.push(path);
      return { scene: new THREE.Group(), animations: [] } as unknown as GLTF;
    });
    const path = '/models/player-scholar.glb?v=original';
    const lease = await pool.acquire(path);
    lease.release();
    await pool.prefetch(path);
    assert.deepEqual(requests, [`${RUNTIME_ASSET_BASE_URL}${path}`]);
    assert.deepEqual(decoded, [path]);
    assert.equal(pool.stats().liveLeases, 0);
    assert.equal(pool.stats().downloads, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
