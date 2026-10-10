// Owns delivery URLs while the game keeps stable logical asset IDs and cache keys.
export const RUNTIME_ASSET_BASE_URL = 'https://pub-79c7cda7fb524f4fab929b74d14c5f1f.r2.dev';

/** Local mode is explicit for offline development after `npm run assets:fetch`. */
export function runtimeAssetUrl(
  path: string,
  base = import.meta.env?.VITE_RUNTIME_ASSET_BASE_URL ?? RUNTIME_ASSET_BASE_URL,
): string {
  const isModel = /^\/models\/.+\.glb(?:[?#]|$)/.test(path);
  const isMaterial = /^\/materials\//.test(path);
  if ((!isModel && !isMaterial) || base === 'local') return path;
  if (!/^https?:\/\//.test(base)) throw new Error('Runtime asset base must be an HTTP(S) URL or "local"');
  return `${base.replace(/\/+$/, '')}${path}`;
}
