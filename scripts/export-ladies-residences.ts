import {writeFileSync,mkdirSync} from 'node:fs';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createPalaceWorld} from '../src/palace/world.ts';
class Reader{result:ArrayBuffer|string|null=null;onloadend:(()=>void)|null=null;async readAsArrayBuffer(blob:Blob){this.result=await blob.arrayBuffer();this.onloadend?.();}async readAsDataURL(blob:Blob){this.result='data:'+blob.type+';base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onloadend?.();}}
Object.assign(globalThis,{FileReader:Reader});
const w=createPalaceWorld([],'concubine',false,'ladies');
w.player.group.removeFromParent();if(w.bedFallback)w.bedFallback.visible=false;
// Three's hemisphere light cannot be exported; the proof renderer supplies documented bounce fills.
const warn=console.warn;console.warn=(...args:unknown[])=>warn(String(args[0]));
mkdirSync('validation/ladies-residences',{recursive:true});
writeFileSync('validation/ladies-residences/ladies-residential-geometry.glb',Buffer.from(await new GLTFExporter().parseAsync(w.scene,{binary:true}) as ArrayBuffer));
writeFileSync('validation/ladies-residences/layout-evidence.json',JSON.stringify({zone:w.zone,bounds:w.bounds,spawn:w.spawn,gates:w.gates,expansion:w.scene.userData.residentialExpansion,colliders:w.colliders,viewBlockers:w.viewBlockers},null,2));
console.warn=warn;w.dispose();console.log('Exported exact Ladies architecture; authored bed is added at the recorded runtime position by the offline proof renderer.');
