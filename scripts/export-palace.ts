import { writeFileSync } from 'node:fs';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createPalaceWorld } from '../src/palace/world.ts';
// Node-only adapter for the official Three exporter; no browser interaction.
class Reader { result: ArrayBuffer | string | null = null; onloadend: (() => void) | null=null;
  async readAsArrayBuffer(blob:Blob){this.result=await blob.arrayBuffer();this.onloadend?.();}
  async readAsDataURL(blob:Blob){this.result='data:'+blob.type+';base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onloadend?.();}
}
Object.assign(globalThis,{FileReader:Reader});
const world=createPalaceWorld([{name:'Maid Ling',type:'minor'},{name:'Minister Chen',type:'side'},{name:'Crown Prince',type:'major'}],'prince');
const exporter=new GLTFExporter();
const glb=await exporter.parseAsync(world.scene,{binary:true});
writeFileSync('validation/palace/interior-geometry.glb',Buffer.from(glb as ArrayBuffer));
console.log('Exported exact gameplay geometry for offline visual inspection.');world.dispose();
