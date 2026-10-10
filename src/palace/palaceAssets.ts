import * as THREE from 'three';
import { acquireModelInstance, palaceAssetPool, type ModelAssetPool, type ModelInstanceLease } from './assetPool';
import type { PalaceWorld } from './world';
export const THRONE_ASSET_URL='/models/imperial-throne.glb?v=c2bee21c';
export const BED_ASSET_URL='/models/silk-chamber-canopy-bed.glb?v=0fd10fa5e7fccb7b';
export const EMPEROR_ASSET_URL='/models/emperor-runtime.glb?v=b0abb24f3496b9e0';
export const palaceAssetUrls=(zone:string)=>zone==='emperor'?[THRONE_ASSET_URL]:zone==='ladies'?[BED_ASSET_URL]:[];
/** Dispose the returned instance with its mixer when the encounter ends. */
export function acquireEmperorModel(pool:ModelAssetPool=palaceAssetPool,signal?:AbortSignal){return acquireModelInstance(EMPEROR_ASSET_URL,pool,signal);}
/** Only the active zone leases decoded props. Source-byte prefetch is separate. */
export function loadPalaceAssets(world:PalaceWorld,zone:string=world.zone??'emperor',pool:ModelAssetPool=palaceAssetPool){
 const spec=zone==='emperor'?{url:THRONE_ASSET_URL,name:'ImperialThrone',fallback:world.throneFallback,position:[0,.56,-25] as const}:zone==='ladies'&&world.bedFallback?{url:BED_ASSET_URL,name:'LadiesCanopyBed',fallback:world.bedFallback,position:[-14,0,-25] as const}:null;
 if(!spec)return()=>{};
 let disposed=false,lease:ModelInstanceLease|null=null;const abort=new AbortController(),fallbackVisible=spec.fallback.visible;
 acquireModelInstance(spec.url,pool,abort.signal).then(instance=>{
  if(disposed){instance.dispose();return;}lease=instance;const root=instance.root;
  root.position.set(spec.position[0],spec.position[1],spec.position[2]);root.name=spec.name;
  root.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  world.scene.add(root);spec.fallback.visible=false;
 }).catch(()=>{/* The readable placeholder remains if optional art cannot load. */});
 return()=>{if(disposed)return;disposed=true;abort.abort();lease?.dispose();lease=null;spec.fallback.visible=fallbackVisible;};
}
