import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

export interface ModelLease { asset: GLTF; release: () => void }
interface DecodedEntry { refs: number; pending: Promise<GLTF>; asset?: GLTF }
export interface AssetPoolStats { liveLeases: number; decodedAssets: number; pendingAssets: number; cachedBytes: number; cachedFiles: number; downloads: number; cacheHits: number; decodes: number; disposals: number }

function disposeTemplate(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), skeletons = new Set<THREE.Skeleton>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometry.add(object.geometry);
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const bitmaps = new Set<{ close: () => void }>();
  textures.forEach(texture => { const bitmap = texture.image as {close?:()=>void}|undefined; if (bitmap && typeof bitmap.close === 'function') bitmaps.add(bitmap as {close:()=>void}); texture.dispose(); });
  bitmaps.forEach(bitmap => bitmap.close());
  skeletons.forEach(skeleton => skeleton.dispose());
  materials.forEach(material => material.dispose()); geometry.forEach(value => value.dispose());
}

/** Active decoded art is reference-counted; only compressed source bytes get an LRU cache.
 * Releasing the final lease disposes GPU-capable resources rather than hiding a zone.
 * The byte budget is fixed; an evicted file may legitimately be downloaded again. */
export class ModelAssetPool {
  private bytes = new Map<string, ArrayBuffer>();
  private downloads = new Map<string, Promise<ArrayBuffer>>();
  private models = new Map<string, DecodedEntry>();
  private counters = { liveLeases: 0, downloads: 0, cacheHits: 0, decodes: 0, disposals: 0 };
  private readonly byteBudget:number;
  private readonly fetchBytes:(url:string)=>Promise<ArrayBuffer>;
  private readonly decode:(bytes:ArrayBuffer,url:string)=>Promise<GLTF>;
  constructor(
    byteBudget = 64 * 1024 * 1024,
    fetchBytes: (url: string) => Promise<ArrayBuffer> = async url => {
      const response = await fetch(url, { cache: 'force-cache', signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`Asset download failed: ${response.status}`);
      return response.arrayBuffer();
    },
    decode: (bytes: ArrayBuffer, url: string) => Promise<GLTF> = (bytes, url) => new GLTFLoader().parseAsync(bytes, url.slice(0, url.lastIndexOf('/') + 1)),
  ) {this.byteBudget=byteBudget;this.fetchBytes=fetchBytes;this.decode=decode;}
  private async source(url: string): Promise<ArrayBuffer> {
    const cached = this.bytes.get(url);
    if (cached) { this.bytes.delete(url); this.bytes.set(url, cached); this.counters.cacheHits++; return cached; }
    const existing = this.downloads.get(url); if (existing) return existing;
    this.counters.downloads++;
    const pending = this.fetchBytes(url).then(data => {
      this.bytes.set(url, data);
      let total = [...this.bytes.values()].reduce((sum, value) => sum + value.byteLength, 0);
      while (total > this.byteBudget && this.bytes.size) {
        const oldest = this.bytes.keys().next().value!; total -= this.bytes.get(oldest)!.byteLength; this.bytes.delete(oldest);
      }
      return data;
    }).finally(() => { this.downloads.delete(url); });
    this.downloads.set(url, pending); return pending;
  }
  /** Cancellation relinquishes a pending lease immediately. Shared downloads may finish
   * into the bounded byte cache, but abandoned requests never keep a decoded template. */
  async acquire(url: string, signal?: AbortSignal): Promise<ModelLease> {
    if (signal?.aborted) throw new DOMException('Model load cancelled', 'AbortError');
    let entry = this.models.get(url);
    if (!entry) {
      const created: DecodedEntry = { refs: 0, pending: Promise.resolve(null as unknown as GLTF) };
      created.pending = this.source(url).then(bytes => {
        // A departed zone can still warm the byte cache without decoding unused art.
        if (created.refs === 0) {
          if (this.models.get(url) === created) this.models.delete(url);
          throw new DOMException('Model load cancelled', 'AbortError');
        }
        this.counters.decodes++;
        return this.decode(bytes, url);
      }).then(asset => {
        created.asset = asset;
        if (created.refs === 0) {
          disposeTemplate(asset.scene); this.counters.disposals++;
          if (this.models.get(url) === created) this.models.delete(url);
        }
        return asset;
      });
      entry = created; this.models.set(url, entry);
    }
    entry.refs++; this.counters.liveLeases++;
    const chosen = entry;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      chosen.refs--; this.counters.liveLeases--;
      if (chosen.refs === 0 && chosen.asset) {
        disposeTemplate(chosen.asset.scene); this.counters.disposals++;
        if (this.models.get(url) === chosen) this.models.delete(url);
      }
    };
    return new Promise<ModelLease>((resolve, reject) => {
      const abort = () => { release(); reject(new DOMException('Model load cancelled', 'AbortError')); };
      signal?.addEventListener('abort', abort, { once: true });
      chosen.pending.then(asset => {
        signal?.removeEventListener('abort', abort);
        if (!released) resolve({ asset, release });
      }, error => {
        signal?.removeEventListener('abort', abort);
        release();
        if (chosen.refs === 0 && this.models.get(url) === chosen) this.models.delete(url);
        reject(error);
      });
    });
  }

  /** Prefetch source bytes only. It does not retain decoded meshes or GPU resources. */
  async prefetch(url: string) { await this.source(url); }
  stats(): AssetPoolStats {
    return { ...this.counters, decodedAssets: [...this.models.values()].filter(entry => entry.asset).length, pendingAssets: [...this.models.values()].filter(entry => !entry.asset).length, cachedFiles: this.bytes.size, cachedBytes: [...this.bytes.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0) };
  }
}
export const palaceAssetPool = new ModelAssetPool();

export interface ModelInstanceLease {
  root: THREE.Object3D;
  animations: readonly THREE.AnimationClip[];
  /** Clone only named color slots; other materials and all geometry stay shared. */
  applyPalette: (colors: Readonly<Record<string,string>>) => void;
  /** Pass the actor's mixer so animation bindings are released before template art. */
  dispose: (mixer?: THREE.AnimationMixer | null) => void;
}

/** A private skeleton per actor; geometry, materials and textures belong to the pool.
 * Never dispose a clone's shared meshes directly. Dispose this instance instead. */
export async function acquireModelInstance(
  url: string,
  pool: ModelAssetPool = palaceAssetPool,
  signal?: AbortSignal,
): Promise<ModelInstanceLease> {
  const lease = await pool.acquire(url, signal);
  if (signal?.aborted) {
    lease.release();
    throw new DOMException('Model load cancelled', 'AbortError');
  }
  let root: THREE.Object3D;
  try { root = clone(lease.asset.scene); }
  catch (error) { lease.release(); throw error; }
  let disposed = false;
  const privateMaterials=new Map<THREE.Material,THREE.Material>();
  return {
    root,
    animations: lease.asset.animations,
    applyPalette(colors) {
      if(disposed)return;
      root.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        const apply=(material:THREE.Material)=>{
          const color=colors[material.name];if(!color||!('color' in material)||!(material.color instanceof THREE.Color))return material;
          let own=privateMaterials.get(material);
          if(!own){own=material.clone();privateMaterials.set(material,own);privateMaterials.set(own,own);}
          const standard=own as THREE.MeshStandardMaterial,basePeak=Math.max(standard.color.r,standard.color.g,standard.color.b),emission=standard.emissive;
          const ratio=emission?Math.max(emission.r,emission.g,emission.b)/Math.max(.000001,basePeak):0;
          standard.color.set(color);if(emission&&ratio>0)emission.copy(standard.color).multiplyScalar(ratio);
          return own;
        };
        object.material=Array.isArray(object.material)?object.material.map(apply):apply(object.material);
      });
    },
    dispose(mixer) {
      if (disposed) return;
      disposed = true;
      mixer?.stopAllAction(); mixer?.uncacheRoot(root);
      root.removeFromParent();
      const skeletons = new Set<THREE.Skeleton>();
      root.traverse(object => { if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton); });
      skeletons.forEach(skeleton => skeleton.dispose());
      new Set(privateMaterials.values()).forEach(material=>material.dispose());privateMaterials.clear();
      lease.release();
    },
  };
}
