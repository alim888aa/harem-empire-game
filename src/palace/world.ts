import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createPalaceNavigator, type Waypoint } from './navigation';
import { addHallDetails } from './hallDetails';
import { addPalaceCraft } from './palaceCraft';
import { addPalaceRoomFocals } from './palaceRoomFocals';
import { ZONES, zoneGates, zoneSpawn, type PlayableZone, type NpcVisitPose } from './zones';

export type CourtPerson = { name: string; displayName?: string; type: 'major' | 'side' | 'minor' };
export type Collider = { x: number; z: number; w: number; d: number; height: number; minY: number };
export type PalaceWorld = ReturnType<typeof createPalaceWorld>;

// Original architecture with bundled, attributed PBR maps. Authored GLB art loads separately.
export function createPalaceWorld(people: CourtPerson[], _playerType: string, software=false, zone:PlayableZone='library', savedNpcs:Record<string,NpcVisitPose>={}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c4d9d3');
  scene.fog = new THREE.Fog('#c4d9d3', 38, 105);
  const roomFocals = addPalaceRoomFocals(scene, zone, { software });
  const colliders: Collider[] = [...roomFocals.colliders];
  const viewBlockers: Collider[] = [...roomFocals.viewBlockers];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const material = (color: string, metalness = 0, roughness = 0.8) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness }); materials.push(m); return m;
  };
  const stone = material('#c4b293'), pale = material('#f6e9ca');
  const red = material('#7b3433'), darkRed = material('#4a252c'), jade = material('#315e5a');
  const gold = material('#c69a50', .55, .35);
  const pink = material('#e6ada0'), blush = material('#f2c6b3');
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    geometries.push(geo); const obj = new THREE.Mesh(geo, mat); obj.position.set(x,y,z); obj.castShadow = true; obj.receiveShadow = true;
    if(!(software&&geo instanceof THREE.TorusGeometry))parent.add(obj);return obj;
  };
  const textured = (m: THREE.MeshStandardMaterial, name: string, base: string, normal: string, rough: string, repeat = 1) => {
    m.name=name;
    if(typeof document==='undefined'||software)return;
    const loader=new THREE.TextureLoader();
    const get=(path:string,color=false)=>{const t=loader.load('/materials/'+path);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);if(color)t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;};
    m.map=get(base,true);m.normalMap=get(normal);m.roughnessMap=get(rough);m.normalScale.set(.22,.22);m.needsUpdate=true;
  };
  textured(red,'Vermilion lacquer','dark_wood_diff_1k.jpg','dark_wood_nor_gl_1k.jpg','dark_wood_rough_1k.jpg',2);
  red.color.set('#af6050');
  textured(gold,'Aged brass','metal_0065_color_1k.jpg','metal_0065_normal_opengl_1k.png','metal_0065_roughness_1k.jpg',1);gold.color.set('#dfc896');
  // SVG uses a painter's algorithm rather than a depth buffer. Subdivide long surfaces
  // so a floor/ceiling triangle spanning the camera cannot paint over the whole palace.
  const box = (w: number,h: number,d: number,mat: THREE.Material,x: number,y: number,z: number,parent?: THREE.Object3D) => {
    const object=mesh(new THREE.BoxGeometry(w,h,d,software?Math.ceil(w/3):1,software?Math.ceil(h/3):1,software?Math.ceil(d/3):1),mat,x,y,z,parent);
    if(software&&((h<.085&&y>2.5&&w<4&&d<4)||(mat===gold&&Math.min(w,h,d)<.1&&Math.max(w,h,d)<4)))object.removeFromParent();
    return object;
  };
  const cylinder = (r: number,rb: number,h: number,mat: THREE.Material,x: number,y: number,z: number,parent?: THREE.Object3D) => mesh(new THREE.CylinderGeometry(r,rb,h,software?6:12),mat,x,y,z,parent);
  const sphere = (r: number,mat: THREE.Material,x: number,y: number,z: number,parent?: THREE.Object3D) => mesh(new THREE.SphereGeometry(r,software?6:10,software?4:8),mat,x,y,z,parent);
  const obstacle = (x:number,z:number,w:number,d:number,height=1.35,minY=0) => colliders.push({x,z,w,d,height,minY});
  const definition=ZONES[zone],bounds=definition.bounds,gates=zoneGates(zone),spawn=zoneSpawn(zone),ceilingHeight=definition.ceilingHeight;
  const courtBounds=zone==='ladies'?{...bounds,minZ:-20}:bounds;
  const courtDepth=courtBounds.maxZ-courtBounds.minZ,courtCenterZ=(courtBounds.maxZ+courtBounds.minZ)/2;
  red.color.set(definition.wall);
  const groundHeight=(x:number,z:number)=>{
    if(zone!=='emperor')return roomFocals.floorHeight(x,z);
    let height=0;if(Math.abs(x)<5.35&&Math.abs(z+25)<2.4)height=.095;
    for(let i=0;i<3;i++)if(Math.abs(x)<(10.4-i*.65)/2&&Math.abs(z+25)<(4.5-i*.45)/2)height=.24+i*.16;
    return height;
  };
  scene.background=new THREE.Color(zone==='ladies'?'#9cb5ab':'#222b30');
  scene.fog=new THREE.Fog(zone==='ladies'?'#9cb5ab':'#222b30',38,85);
  const hemisphere=new THREE.HemisphereLight('#fff3d6','#708982',2.6);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight('#ffe1ac',3.7);sun.position.set(-20,32,18);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-30;
  sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);
  const timber=material('#a68e74'),floorMat=material(definition.floor),floorAlt=material('#afa58e'),paper=material('#d9c7a1');
  textured(timber,'Dark hardwood','dark_wood_diff_1k.jpg','dark_wood_nor_gl_1k.jpg','dark_wood_rough_1k.jpg',2);
  textured(floorMat,'Stone tiles','marble_01_diff_1k.jpg','marble_01_nor_gl_1k.jpg','marble_01_rough_1k.jpg',1);
  const width=bounds.maxX-bounds.minX,depth=bounds.maxZ-bounds.minZ,centerZ=(bounds.maxZ+bounds.minZ)/2;
  if(!software)box(width,.4,depth,stone,0,-.23,centerZ);
  for(let x=bounds.minX+1;x<bounds.maxX;x+=2)for(let z=bounds.minZ+1;z<bounds.maxZ;z+=2){
    const tile=box(1.985,.055,1.985,(Math.round(x+z)%4===0)?floorMat:floorAlt,x,0,z);if(software)tile.renderOrder=-50;
  }
  const wall=(x:number,z:number,w:number,d:number,h=ceilingHeight)=>{
    box(w,h,d,red,x,h/2,z);box(w+.02,.35,d+.02,timber,x,.2,z);box(w+.03,.16,d+.03,gold,x,h-.2,z);obstacle(x,z,w,d,h);
  };
  // Four actual corridor portals, with solid wall segments either side.
  const opening=2.2;
  for(const [edge,gap] of [[courtBounds.minZ,-6],[courtBounds.maxZ,6]]){
    if(zone==='ladies'&&edge===courtBounds.minZ){
      // Three courtyard doors lead to the two chambers and a through-gallery.
      const doorCenters=[-14,-6,10];let cursor=bounds.minX;
      for(const x of doorCenters){
        wall((cursor+x-opening)/2,edge,x-opening-cursor,.35);
        box(opening*2,ceilingHeight-3.5,.4,timber,x,(ceilingHeight+3.5)/2,edge);
        viewBlockers.push({x,z:edge,w:opening*2,d:.4,minY:3.5,height:ceilingHeight});
        cursor=x+opening;
      }
      wall((cursor+bounds.maxX)/2,edge,bounds.maxX-cursor,.35);
      // The Library destination remains the north portal, now at the outer wall.
      wall((bounds.minX-6-opening)/2,bounds.minZ,-6-opening-bounds.minX,.35);
      wall((-6+opening+bounds.maxX)/2,bounds.minZ,bounds.maxX+6-opening,.35);
      box(opening*2,ceilingHeight-3.5,.4,timber,-6,(ceilingHeight+3.5)/2,bounds.minZ);
      viewBlockers.push({x:-6,z:bounds.minZ,w:opening*2,d:.4,minY:3.5,height:ceilingHeight});
    }else{
      wall((bounds.minX+gap-opening)/2,edge,gap-opening-bounds.minX,.35);
      wall((gap+opening+bounds.maxX)/2,edge,bounds.maxX-gap-opening,.35);
      box(opening*2,ceilingHeight-3.5,.4,timber,gap,(ceilingHeight+3.5)/2,edge);
      viewBlockers.push({x:gap,z:edge,w:opening*2,d:.4,minY:3.5,height:ceilingHeight});
    }
  }
  for(const edge of [bounds.minX,bounds.maxX]){
    wall(edge,(bounds.minZ-opening)/2,.35,-opening-bounds.minZ);
    wall(edge,(opening+bounds.maxZ)/2,.35,bounds.maxZ-opening);
    box(.4,ceilingHeight-3.5,opening*2,timber,edge,(ceilingHeight+3.5)/2,0);
    viewBlockers.push({x:edge,z:0,w:.4,d:opening*2,minY:3.5,height:ceilingHeight});
  }
  // Ladies has an open central flower court; other zones have real high ceilings.
  if(zone==='emperor'){
    box(width,.2,31,timber,0,7.3,8);box(width,.2,20,timber,0,9.1,-18);
    viewBlockers.push({x:0,z:8,w:width,d:31,minY:7.2,height:7.4},{x:0,z:-18,w:width,d:20,minY:9,height:9.2});
  }else if(zone!=='ladies'){
    box(width,.2,depth,timber,0,ceilingHeight+.1,centerZ);
    viewBlockers.push({x:0,z:centerZ,w:width,d:depth,minY:ceilingHeight,height:ceilingHeight+.2});
  }else{
    // The original court stays open; only its side galleries and north rooms are roofed.
    for(const x of [-15,15]){box(9,.2,courtDepth,timber,x,ceilingHeight+.1,courtCenterZ);viewBlockers.push({x,z:courtCenterZ,w:9,d:courtDepth,minY:ceilingHeight,height:ceilingHeight+.2});}
    const annexDepth=courtBounds.minZ-bounds.minZ,annexCenter=(courtBounds.minZ+bounds.minZ)/2;
    box(width,.2,annexDepth,timber,0,ceilingHeight+.1,annexCenter);
    viewBlockers.push({x:0,z:annexCenter,w:width,d:annexDepth,minY:ceilingHeight,height:ceilingHeight+.2});
  }
  for(let z=bounds.minZ+4;z<bounds.maxZ;z+=8){box(width,.25,.24,darkRed,0,ceilingHeight-.2,z);viewBlockers.push({x:0,z,w:width,d:.3,minY:ceilingHeight-.4,height:ceilingHeight});}
  const column=(x:number,z:number,h=ceilingHeight)=>{box(.8,.2,.8,stone,x,.1,z);cylinder(.24,.3,h-.4,red,x,h/2,z);box(.9,.22,.9,gold,x,h-.2,z);obstacle(x,z,.7,.7,h);};
  if(zone==='emperor'){
    // The authored joinery layer is anchored to these original walls and columns.
    for(const x of [-8,8])for(const z of [-24,-16,-8,0,8,16])column(x,z,z<-8?8.4:6.5);
    for(const x of [-11,11])for(const [z,d] of [[-24,8],[-10,8],[8,8],[21,6]])wall(x,z,.3,d,z<-8?8.8:7.1);
    for(const z of [-8,10]){box(22,.9,.55,darkRed,0,6.35,z);viewBlockers.push({x:0,z,w:22,d:.7,minY:5.85,height:6.9});}
  }else for(const x of [-10,10])for(const z of [-12,10])column(x,z);
  const rug=material(zone==='library'?'#40565a':zone==='ladies'?'#648579':zone==='dowager'?'#5b4f6c':'#743735');
  const runner=box(3.5,.055,courtDepth-5,rug,0,.075,courtCenterZ);if(software)runner.renderOrder=-49;
  for(const x of [-1.72,1.72]){const trim=box(.045,.008,courtDepth-5,gold,x,.111,courtCenterZ);if(software)trim.renderOrder=-48;}
  const lampMat=material('#f7d79c');
  const lantern=(x:number,z:number)=>{
    cylinder(.025,.025,ceilingHeight-2.5,gold,x,(ceilingHeight+2.5)/2,z);cylinder(.34,.34,.65,lampMat,x,2.6,z);
    cylinder(.41,.41,.09,timber,x,2.96,z);cylinder(.41,.41,.09,timber,x,2.25,z);
    viewBlockers.push({x,z,w:.85,d:.85,minY:2.2,height:3.02});
    const glow=new THREE.PointLight('#ffd297',9,11,2);glow.position.set(x,2.6,z);scene.add(glow);
  };
  for(const x of [-6,6])for(const z of [-11,9])lantern(x,z);
  const table=(x:number,z:number,w=3,d=1.3)=>{box(w,.16,d,timber,x,1.1,z);for(const a of [-1,1])for(const b of [-1,1])box(.12,1,.12,darkRed,x+a*(w/2-.2),.54,z+b*(d/2-.2));obstacle(x,z,w,d,1.2);};
  const chair=(x:number,z:number,rotation=0)=>{
    const pieces=[box(.7,.14,.65,darkRed,x,.55,z),box(.72,.8,.1,timber,x,1,z-.3)];
    for(const a of [-.25,.25])for(const b of [-.23,.23])pieces.push(box(.07,.6,.07,timber,x+a,.27,z+b));
    if(rotation){const pivot=new THREE.Vector3(x,0,z),up=new THREE.Vector3(0,1,0);for(const piece of pieces){piece.position.sub(pivot).applyAxisAngle(up,rotation).add(pivot);piece.rotation.y=rotation;}}
    const c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation));obstacle(x,z,.75*c+.7*s,.7*c+.75*s,1.45);
  };
  const vase=(x:number,z:number,y=0)=>{cylinder(.2,.34,.6,jade,x,y+.32,z);cylinder(.16,.14,.2,gold,x,y+.72,z);for(let i=0;i<4;i++){sphere(.13,i%2?pink:blush,x+(i-1.5)*.15,y+1.45,z);cylinder(.018,.018,.8,darkRed,x+(i-1.5)*.08,y+1,z);}};
  const screen=(x:number,z:number,w=5)=>{box(w,3.1,.18,paper,x,1.65,z);for(let dx=-w/2;dx<=w/2;dx+=1.2)box(.08,3.4,.24,darkRed,x+dx,1.7,z);for(const y of [.25,3.15])box(w,.12,.24,gold,x,y,z);obstacle(x,z,w,.25,3.4);};
  const throneFallback=new THREE.Group();throneFallback.name='ThronePlaceholder';scene.add(throneFallback);
  // Grouped before batching so the streamed authored bed can replace only its proxy.
  const bedFallback=zone==='ladies'?new THREE.Group():null;
  if(bedFallback){bedFallback.name='LadiesCanopyBedPlaceholder';bedFallback.position.set(-14,0,-25);scene.add(bedFallback);}
  const water=material('#557b76',.4,.2),fountain=new THREE.Group();
  const drops:THREE.Mesh[]=[],banners:THREE.Mesh[]=[];
  if(zone==='emperor'){
    box(10.7,.1,4.8,stone,0,.045,-25);for(let i=0;i<3;i++)box(10.4-i*.65,.16,4.5-i*.45,stone,0,.16+i*.16,-25);
    box(2.2,.4,1.8,gold,0,.9,-25,throneFallback);box(2.1,2.3,.25,gold,0,2,-26.1,throneFallback);
    box(1.8,1.9,.1,darkRed,0,2,-25.94,throneFallback);box(1.85,.2,1.6,rug,0,1.2,-25,throneFallback);
    obstacle(0,-25,2.8,2,3.25);obstacle(0,-26.3,8,.22,6.56);
    screen(0,-27.2,10);const seal=mesh(new THREE.CircleGeometry(1.9,32),gold,0,4.65,-27.02);seal.castShadow=false;
    for(const x of [-15,15])for(const z of [-18,2,14]){table(x,z,3.4,1.3);vase(x+.9,z,1.2);}
  }else if(zone==='library'){
    for(const x of [-14,14,-7,7])for(const z of [-13,-6,7,14]){
      box(.65,3.3,3.6,timber,x,1.7,z);obstacle(x,z,1.1,3.6,3.5);
      for(let y=.6;y<3.2;y+=.65){box(1,.06,3.6,darkRed,x,y,z);for(let i=0;i<6;i++){const roll=cylinder(.065,.065,.65,paper,x,y+.16,z-1.4+i*.5);roll.rotation.z=Math.PI/2;}}
    }
    for(const x of [-3.5,3.5]){table(x,-12,2.2,1.4);chair(x,-10.5);box(1,.015,.7,paper,x,1.2,-12);}
    table(0,7,4,1.7);chair(0,9);screen(9,-18,5);
  }else if(zone==='empress'){
    screen(0,-18,11);table(0,-15,4,1.6);chair(0,-17);vase(-1.3,-15,1.2);vase(1.3,-15,1.2);
    for(const x of [-12,12]){screen(x,5,7);table(x,-6,3.5,1.6);chair(x,-4.3);vase(x+1,-6,1.2);}
    for(const x of [-13,13])for(const z of [11,15]){box(2.4,.45,1.2,rug,x,.35,z);obstacle(x,z,2.4,1.2,.65);}
  }else if(zone==='ladies'){
    const leaves=material('#4e7154');
    for(const x of [-9,9])for(const z of [-7,7]){box(3.2,.45,3.2,stone,x,.22,z);obstacle(x,z,3.2,3.2,1.4);for(let i=0;i<5;i++)sphere(.5,leaves,x+Math.sin(i*2)*.9,.7,z+Math.cos(i*2)*.9);vase(x,z,.45);}
    for(const x of [-15,15]){table(x,-12,3.2,1.3);chair(x,-10.5);box(2.5,.1,.5,darkRed,x,1.25,-12);for(let i=0;i<7;i++)box(2.3,.009,.009,gold,x,1.31,-12.2+i*.06);screen(x,10,5);}
    cylinder(1.3,1.5,.45,stone,0,.22,-9);cylinder(1.2,1.2,.03,water,0,.46,-9);obstacle(0,-9,3,3,.6);
    // Two connected residential chambers add an 8 m north wing (320 m² gross).
    // A 4.4 m through-gallery connects both chambers and reaches the Library gate.
    // Door openings in both side walls keep it separate from private furnishings.
    for(const x of [-8.2,-3.8]){
      wall(x,-27.25,.35,1.5);wall(x,-21.25,.35,2.5);
      box(.4,ceilingHeight-3.5,4,timber,x,(ceilingHeight+3.5)/2,-24.5);
      viewBlockers.push({x,z:-24.5,w:.4,d:4,minY:3.5,height:ceilingHeight});
    }
    const galleryFloor=box(3.4,.02,7.6,pale,-6,.055,-24);if(software)galleryFloor.renderOrder=-49;
    for(const x of [-14,10]){
      const threshold=box(4.3,.035,.7,pale,x,.053,-20);if(software)threshold.renderOrder=-48;
      for(const side of [-1,1])box(.14,3.5,.18,darkRed,x+side*2.1,1.75,-19.8);
      box(4.3,.2,.18,darkRed,x,3.6,-19.8);
    }
    const interiorRug=material('#77656b'),salonRug=material('#758176');
    const bedRug=box(7.4,.022,4.7,interiorRug,-14,.055,-24.9);if(software)bedRug.renderOrder=-49;
    const sittingRug=box(7.2,.022,4.8,salonRug,7,.055,-24.3);if(software)sittingRug.renderOrder=-49;
    if(bedFallback){
      box(3.26,.48,2.24,timber,0,.32,0,bedFallback);
      box(3.02,.23,2.06,pale,0,.75,0,bedFallback);
      box(3.1,.08,1.5,interiorRug,0,.89,.29,bedFallback);
      box(3.06,1.05,.1,timber,0,1.32,-1.08,bedFallback);
      for(const x of [-1.58,1.58])for(const z of [-1.08,1.08])cylinder(.075,.09,3.45,darkRed,x,1.725,z,bedFallback);
      for(const z of [-1.09,1.09])box(3.48,.17,.16,timber,0,3.28,z,bedFallback);
      for(const x of [-1.59,1.59])box(.16,.17,2.43,timber,x,3.28,0,bedFallback);
      for(const x of [-1.4,1.4])box(.38,2.3,.05,paper,x,1.8,1.13,bedFallback);
    }
    obstacle(-14,-25,3.6,2.6,3.55);
    // The bed has a clear approach on its south side; lamps remain outside it.
    box(1.4,2.65,.72,timber,-18.5,1.35,-25.4);obstacle(-18.5,-25.4,1.4,.72,2.7);
    for(const x of [-18.82,-18.18])box(.56,2.2,.05,darkRed,x,1.4,-24.995);
    box(.10,.06,.06,gold,-18.5,1.4,-24.95);
    table(1,-26.5,3.2,.9);box(.55,.55,.55,darkRed,1,.29,-25.25);obstacle(1,-25.25,.55,.55,.6);
    const mirror=material('#9da99f',.68,.25);
    box(1.25,1.5,.08,timber,1,1.94,-27.12);box(1.07,1.29,.09,mirror,1,1.94,-27.06);
    box(.45,.12,.3,paper,.1,1.23,-26.5);
    // A short, buildable timber privacy screen; both ends leave walking routes.
    box(.14,2.55,1.6,timber,-10,1.32,-24.9);obstacle(-10,-24.9,.25,1.6,2.65);
    for(let z=-25.5;z<=-24.3;z+=.4)box(.17,2.2,.045,pale,-10,1.35,z);
    // The second chamber is a social/dressing room, not another copy of the hall.
    table(7,-24.5,2.8,1.25);chair(5,-24.5,Math.PI/2);chair(9,-24.5,-Math.PI/2);vase(7,-24.5,1.2);
    for(const x of [6.35,7.65])cylinder(.10,.085,.12,pale,x,1.25,-24.5);
    box(3.4,.50,1.25,timber,14.6,.33,-26.4);box(3.15,.16,1.1,pale,14.6,.67,-26.4);
    box(3.45,.7,.12,darkRed,14.6,1.08,-26.94);obstacle(14.6,-26.4,3.5,1.4,1.45);
    box(2.2,2.75,.7,timber,18.1,1.40,-22.9);obstacle(18.1,-22.9,2.2,.7,2.8);
    for(const x of [17.6,18.6])box(.90,2.28,.055,darkRed,x,1.44,-22.52);
    box(2.0,.70,.75,timber,2.3,.37,-21.4);obstacle(2.3,-21.4,2,.75,.78);
    // Pale high lattice windows make the added enclosed rooms readable.
    const windowMat=new THREE.MeshStandardMaterial({color:'#c6d2ca',emissive:'#a6b6af',emissiveIntensity:.30,roughness:1});materials.push(windowMat);
    for(const x of [-16.2,-10.5,6,13.5]){
      box(3,2.15,.055,windowMat,x,3.0,-27.78);
      for(let dx=-1.5;dx<=1.5;dx+=.5)box(.075,2.24,.1,darkRed,x+dx,3,-27.70);
      for(const y of [1.89,2.45,3,3.55,4.11])box(3.08,.075,.1,darkRed,x,y,-27.70);
    }
    for(const [x,z] of [[-17,-21.7],[-2.0,-22],[11.5,-22]])lantern(x,z);
    scene.userData.residentialExpansion={rooms:2,addedFootprintM2:320,roomGrossAreasM2:{bedroom:94.4,sittingDressing:190.4},galleryGrossAreaM2:35.2,northBounds:{minX:-20,maxX:20,minZ:-28,maxZ:-20},bedPosition:{x:-14,y:0,z:-25},bedRotationY:0,bedCollider:{x:-14,z:-25,w:3.6,d:2.6,minY:0,height:3.55}};
  }else{
    screen(0,-19,9);table(0,-17,4.5,1.5);for(const x of [-1.4,0,1.4]){box(.55,1.15,.18,gold,x,1.8,-17.1);cylinder(.13,.15,.25,jade,x,1.35,-16.6);}
    for(const x of [-12,12]){table(x,8,2.8,1.4);chair(x,10);vase(x,8,1.2);screen(x,-8,5);}
    for(const x of [-5,5]){cylinder(.45,.65,1.3,jade,x,.65,-14);obstacle(x,-14,1.3,1.3,1.4);}
  }
  // Zone changes are explicit door interactions, not holes to a bright skybox.
  // The leaves stay opaque until the loading curtain takes over on Enter.
  // Their collision plane sits behind the interaction point, so every gate stays reachable.
  const portalLacquer=material('#612b29',0,.54);portalLacquer.name='Opaque palace portal lacquer';
  const portalInset=material('#3c2325',0,.72);portalInset.name='Opaque palace portal recessed panel';
  for(const gate of gates){
    const horizontal=Math.abs(gate.z-bounds.minZ)<1.1||Math.abs(gate.z-bounds.maxZ)<1.1;
    const x=horizontal?gate.x:gate.x<0?bounds.minX:bounds.maxX;
    const z=horizontal?(gate.z<centerZ?bounds.minZ:bounds.maxZ):gate.z;
    const root=new THREE.Group();root.name=`PalaceDoor:${gate.to}`;root.position.set(x,0,z);root.rotation.y=horizontal?0:Math.PI/2;scene.add(root);
    for(const side of [-1,1]){
      box(2.17,3.48,.20,portalLacquer,side*1.09,1.74,0,root);
      for(const y of [.8,2.38])box(1.77,1.15,.23,portalInset,side*1.09,y,0,root);
      for(const face of [-1,1]){
        for(const y of [.17,1.58,3.31])box(2.03,.055,.03,gold,side*1.09,y,face*.12,root);
        for(const y of [.5,.8,1.1,2.1,2.4,2.7])for(const dx of [-.68,0,.68])sphere(.032,gold,side*1.09+dx,y,face*.135,root);
        const handle=mesh(new THREE.TorusGeometry(.10,.025,6,12),gold,side*.25,1.55,face*.16,root);handle.rotation.x=.13;
      }
    }
    // Door studs/panels are static too. Keep their semantic group for camera and
    // verification, but batch by material instead of hundreds of tiny draw calls.
    root.updateMatrixWorld(true);
    const doorBatches=new Map<THREE.Material,THREE.BufferGeometry[]>();
    for(const piece of [...root.children])if(piece instanceof THREE.Mesh&&!Array.isArray(piece.material)){
      const geometry=piece.geometry.clone().applyMatrix4(piece.matrix),bucket=doorBatches.get(piece.material)??[];bucket.push(geometry);doorBatches.set(piece.material,bucket);root.remove(piece);
    }
    for(const [mat,parts]of doorBatches){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(geometry){geometries.push(geometry);const batch=new THREE.Mesh(geometry,mat);batch.castShadow=true;batch.receiveShadow=true;root.add(batch);}}
    const blocker={x,z,w:horizontal?4.38:.25,d:horizontal?.25:4.38,height:3.5,minY:0};
    colliders.push(blocker);viewBlockers.push(blocker);
  }
  // Each generated world contains its own gate trim, not meshes from other zones.
  for(const gate of gates){const border=box(3.5,.04,2,gold,gate.x,.08,gate.z);if(software)border.renderOrder=-48;}
  // Batch immutable architectural meshes by material to keep the large palace inexpensive to draw.
  scene.updateMatrixWorld(true);
  const batches=new Map<string,{material:THREE.Material;order:number;geometries:THREE.BufferGeometry[]}>();
  for(const object of [...scene.children])if(object instanceof THREE.Mesh && !Array.isArray(object.material)){
    const copy=object.geometry.clone().applyMatrix4(object.matrixWorld);const key=object.material.uuid+':'+object.renderOrder+(software?`:${Math.floor(object.position.x/6)},${Math.floor(object.position.z/6)}`:'');
    const batch=batches.get(key)||{material:object.material,order:object.renderOrder,geometries:[] as THREE.BufferGeometry[]};batch.geometries.push(copy);batches.set(key,batch);scene.remove(object);
  }
  for(const {material:mat,order,geometries:list} of batches.values()){const merged=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(merged){geometries.push(merged);const obj=new THREE.Mesh(merged,mat);obj.renderOrder=order;obj.castShadow=true;obj.receiveShadow=true;scene.add(obj);}}
  // Spatial anchors never contain a temporary body. Authored GLBs are the only
  // character art, including before loading, after failure, and in software QA.
  const person = () => { const group=new THREE.Group();scene.add(group);return {group}; };
  const player={...person(),moveSpeed:0,airborne:false,jumpVelocity:0};player.group.name='Player';player.group.position.set(spawn.x,0,spawn.z);player.group.rotation.y=Math.PI;
  const navigator=createPalaceNavigator(colliders,bounds);
  const sorted=[...people].sort((a,b)=>a.name.localeCompare(b.name));
  const occupied:{x:number;z:number}[]=[];
  const candidates:{x:number;z:number}[]=[];
  for(let z=bounds.minZ+6;z<bounds.maxZ-5;z+=5)for(const x of [-4,4,-12,12,0]){
    const safe=navigator.closest({x,z});if(safe&&Math.hypot(safe.x-spawn.x,safe.z-spawn.z)>3)candidates.push(safe);
  }
  const npcs=sorted.map((p,i)=>{
    const saved=savedNpcs[p.name];
    const validPose=(pose:{x:number;z:number})=>pose.x>bounds.minX+.5&&pose.x<bounds.maxX-.5&&pose.z>bounds.minZ+.5&&pose.z<bounds.maxZ-.5&&
      !colliders.some(c=>Math.abs(pose.x-c.x)<c.w/2+.4&&Math.abs(pose.z-c.z)<c.d/2+.4)&&!occupied.some(other=>Math.hypot(pose.x-other.x,pose.z-other.z)<1.2);
    const pos=saved?.zone===zone&&validPose(saved)?saved:candidates.find(point=>validPose(point))??{x:spawn.x+(i%3)*1.5,z:spawn.z-3-Math.floor(i/3)*1.5};
    occupied.push(pos);
    const character=person();
    character.group.name=`Courtier:${p.name}`;character.group.position.set(pos.x,groundHeight(pos.x,pos.z),pos.z);
    character.group.rotation.y=saved?.zone===zone?saved.rotationY:Math.PI;
    const ring=mesh(new THREE.RingGeometry(.52,.58,24),gold,pos.x,groundHeight(pos.x,pos.z)+.07,pos.z);ring.rotation.x=-Math.PI/2;
    const destinations=[{x:pos.x,z:pos.z},...candidates.filter((_,index)=>(index+i)%5===0).slice(0,4)];
    const route={stops:destinations,index:0,path:[] as Waypoint[],wait:2+(i%4)*2,blocked:0};
    const roams=p.type!=='major'||p.name==='Empress Dowager';
    return{...p,...character,route,labelHeight:2.2,moveSpeed:0,x:pos.x,z:pos.z,homeX:pos.x,homeZ:pos.z,ring,phase:i*1.73,roams,activity:roams?'Walking the gallery':'Waiting for an audience'};
  });
  const petals:THREE.Mesh[]=[];
  const petalGeo=new THREE.PlaneGeometry(.09,.14);geometries.push(petalGeo);
  const petalMat=new THREE.MeshBasicMaterial({color:'#d5c6a3',side:THREE.DoubleSide});materials.push(petalMat);
  for(let i=0;i<22;i++){const p=new THREE.Mesh(petalGeo,petalMat);p.position.set(Math.sin(i*7.3)*13,1+(i%7),Math.cos(i*3.7)*20);p.rotation.set(i,i,0);scene.add(p);petals.push(p);}
  const palaceCraft=addPalaceCraft(scene,zone,{software});
  const hallDetails=zone==='emperor'?addHallDetails(scene,materials,{software}):{dispose(){}};
  let worldDisposed=false,currentSeason=0;
  const setSeason=(season:number)=>{
    const next=Math.max(1,Math.floor(season));if(next===currentSeason)return;currentSeason=next;
    const mood=[{sun:'#ffe6d6',sky:'#e5ede3',petal:'#e3b6bd'},{sun:'#ffe0b1',sky:'#e9ebd2',petal:'#dad6a8'},{sun:'#efd0a6',sky:'#ddd8ca',petal:'#d2aa76'},{sun:'#d9e8ee',sky:'#d7e3e7',petal:'#dae7e9'}][(next-1)%4];
    sun.color.set(mood.sun);hemisphere.color.set(mood.sky);
    // Touch the live particle material too: the software renderer replaces source
    // materials, while ordinary WebGL keeps the original. Neither needs a rebuild.
    petalMat.color.set(mood.petal);petals.forEach((particle,index)=>{(particle.material as THREE.MeshBasicMaterial).color.set(mood.petal);particle.visible=(next-1)%4!==3||index<10;});
    scene.userData.season=next;
  };
  return {scene,zone,bounds,gates,spawn,ceilingHeight,setSeason,colliders,viewBlockers,groundHeight,throneFallback,bedFallback,player,npcs,water,fountain,
    animate(time:number,dt:number,_moving:boolean,paused=false,reactingNames:ReadonlySet<string>=new Set()){
      npcs.forEach((n,i)=>{
        const strolling=n.roams&&!paused&&!reactingNames.has(n.name);
        n.moveSpeed=0;
        if(strolling){
          const route=n.route;
          route.wait=Math.max(0,route.wait-dt);
          if(route.wait===0){
            if(!route.path.length){
              route.index=(route.index+1)%route.stops.length;
              route.path=navigator.find({x:n.x,z:n.z},route.stops[route.index]);
              if(!route.path.length)route.wait=4;
            }
            const target=route.path[0];
            if(target){
              const dx=target.x-n.x,dz=target.z-n.z,length=Math.hypot(dx,dz),step=Math.min(length,.65*dt),beforeX=n.x,beforeZ=n.z;
              const free=(x:number,z:number)=>Math.hypot(x-player.group.position.x,z-player.group.position.z)>.8&&!colliders.some(c=>Math.abs(x-c.x)<c.w/2+.4&&Math.abs(z-c.z)<c.d/2+.4)&&!npcs.some(other=>other!==n&&Math.hypot(x-other.x,z-other.z)<.8);
              if(length>.001){
                const nx=n.x+dx/length*step,nz=n.z+dz/length*step;
                if(free(nx,n.z))n.x=nx;if(free(n.x,nz))n.z=nz;
              }
              const movedX=n.x-beforeX,movedZ=n.z-beforeZ;n.moveSpeed=dt>0?Math.hypot(movedX,movedZ)/dt:0;
              if(n.moveSpeed>.03){const wanted=Math.atan2(movedX,movedZ),difference=THREE.MathUtils.euclideanModulo(wanted-n.group.rotation.y+Math.PI,Math.PI*2)-Math.PI;n.group.rotation.y+=difference*(1-Math.exp(-dt*8));route.blocked=0;}else route.blocked+=dt;
              n.group.position.x=n.x;n.group.position.z=n.z;n.ring.position.set(n.x,groundHeight(n.x,n.z)+.07,n.z);
              if(Math.hypot(target.x-n.x,target.z-n.z)<.055){route.path.shift();if(!route.path.length)route.wait=5+(i%4)*2;}
              // An occupied passage is a reason to wait or choose another destination, never teleport.
              if(route.blocked>3){route.path=[];route.wait=2;route.blocked=0;}
            }
          }
        }
        if(n.roams)n.activity=n.moveSpeed>.03?'Walking the gallery':'Waiting for an audience';
        n.group.position.y=groundHeight(n.x,n.z)+Math.sin(time*1.3+i)*.012;
      });
      drops.forEach((p,i)=>{let a=i/20*Math.PI*2;let phase=(time*.75+i/20)%1;p.position.set(Math.cos(a)*(.15+phase*.85),1.8-Math.pow(phase,2)*1.5,3+Math.sin(a)*(.15+phase*.85));});
      petals.forEach((p,i)=>{p.position.y-=dt*(.22+(i%4)*.07);p.position.x+=dt*Math.sin(time*.5+i)*.12;p.rotation.z+=dt*.6;if(p.position.y<.2)p.position.y=6;});
      banners.forEach((b,i)=>b.rotation.y=Math.sin(time*.8+i)*.04);
    },
    dispose(){if(worldDisposed)return;worldDisposed=true;roomFocals.dispose();palaceCraft.dispose();hallDetails.dispose();sun.shadow.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();}
  };
}
