import assert from 'node:assert/strict';
import { createPalaceWorld } from '../src/palace/world.ts';
const world=createPalaceWorld([{name:'Maid Ling',type:'minor'},{name:'Maid Su',type:'minor'},{name:'Minister Chen',type:'side'},{name:'Minister Wang',type:'side'},{name:'Prince Feng',type:'side'},{name:'Concubine Mei',type:'side'},{name:'Crown Prince',type:'major'},{name:'Empress Consort',type:'major'}],'prince');
const free=(x:number,z:number)=>Math.abs(x)<23.2&&z>-26.2&&z<23.2&&!world.colliders.some(c=>Math.abs(x-c.x)<c.w/2+.32&&Math.abs(z-c.z)<c.d/2+.32);
const seen=new Set(['0,38']),queue=[[0,38]];for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,key=`${a},${b}`;if(!seen.has(key)&&free(a*.5,b*.5)){seen.add(key);queue.push([a,b]);}}}
const rooms=[[0,19],[0,0],[0,-18],[-17,-18],[17,-22],[-17,0],[16,0],[-17,16],[17,16]];
for(const [x,z]of rooms)assert.ok(seen.has(`${x*2},${z*2}`),`Room ${x},${z} must connect to spawn`);
for(const n of world.npcs)assert.ok(queue.some(([x,z])=>Math.hypot(x*.5-n.x,z*.5-n.z)<2.6),`${n.name} must be approachable`);
console.log(`PASS: all ${rooms.length} room landmarks and ${world.npcs.length} NPC stations reachable at 0.5m grid; ${seen.size} walkable cells.`);
console.log('This is a deterministic layout check, not browser gameplay QA.');world.dispose();
