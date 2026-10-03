import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type FocalRoom = 'empress' | 'dowager' | 'ladies';
export type PalaceFocalZone = FocalRoom | 'library' | 'emperor';
export interface FocalCollider { id:string; x:number; z:number; w:number; d:number; minY:number; height:number }
export interface FocalFloor { id:string; x:number; z:number; w:number; d:number; top:number }
export interface FocalStats { drawCalls:number; triangles:number; materials:number; geometries:number }
export interface FocalOptions { software?:boolean }

/**
 * Additive, texture-free room-specific composition kit. Metres, +Y up, current world origin.
 * Does not mutate the source world, its resources, lighting, colliders, NPCs or asset pool.
 * IMPORTANT: install returned colliders BEFORE constructing the navigator/NPCs, merge
 * floorHeight into world.groundHeight, and add viewBlockers before using the camera.
 * Existing collision contracts are kept. New raised footprints are explicitly returned.
 * Only current-zone owned resources are created. dispose() is idempotent.
 */
export function addPalaceRoomFocals(scene:THREE.Scene, zone:PalaceFocalZone, options:FocalOptions={}) {
  const root=new THREE.Group();root.name=`PalaceRoomFocals:${zone}`;
  const colliders:FocalCollider[]=[],viewBlockers:FocalCollider[]=[],floors:FocalFloor[]=[];
  const geometries:THREE.BufferGeometry[]=[],materials:THREE.MeshStandardMaterial[]=[];
  const stats:FocalStats={drawCalls:0,triangles:0,materials:0,geometries:0};
  let disposed=false;
  const floorHeight=(x:number,z:number)=>floors.reduce((h,f)=>Math.abs(x-f.x)<=f.w/2+.001&&Math.abs(z-f.z)<=f.d/2+.001?Math.max(h,f.top):h,0);
  const dispose=()=>{if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear();};
  const result={root,colliders,viewBlockers,floors,floorHeight,stats,dispose};
  if(options.software||zone==='library'||zone==='emperor')return result;
  const m=(name:string,color:string,roughness=.78,metalness=0)=>{const mat=new THREE.MeshStandardMaterial({name:`Focal • ${name}`,color,roughness,metalness});materials.push(mat);return mat;};
  const wood=m('carved rosewood','#3e251e'),black=m('recessed joinery','#201c1d'),brass=m('aged gilt','#be9145',.4,.42),paleGold=m('silk embroidery','#dec386',.65,.1);
  const red=m('cinnabar lacquer','#8e202c',.49),silk=m(zone==='dowager'?'plum velvet':'red silk',zone==='dowager'?'#58465f':'#a8323e',.92),silkLight=m(zone==='dowager'?'lilac cushions':'rose cushions',zone==='dowager'?'#a18ba3':'#be7880',.97);
  const ivory=m('ivory porcelain','#e2dac0',.55),stone=m('warm carved limestone','#aea593',.92),paper=m('warm landscape silk','#d5c6a7',.97),ink=m('pine and ink','#405b4c',.92),celadon=m('celadon glaze','#648c7d',.35,.08);
  const water=m('deep pond water','#3b7370',.28,.2),leaf=m('garden foliage','#365f43',.91),leafLight=m('young foliage','#6f8b51',.94),pink=m('magnolia petals','#ebc3c2',.93),soil=m('garden earth','#4a4834',1),path=m('cool garden stone','#b1b8ad',.93);
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const put=(geo:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number,rot=new THREE.Euler(),scale=new THREE.Vector3(1,1,1))=>{
    const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(rot),scale));
    const list=buckets.get(mat)??[];list.push(g);buckets.set(mat,list);
  };
  const box=(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number,ry=0,rz=0)=>put(new THREE.BoxGeometry(w,h,d),mat,x,y,z,new THREE.Euler(0,ry,rz));
  const cyl=(r:number,rb:number,h:number,mat:THREE.Material,x:number,y:number,z:number,n=16)=>put(new THREE.CylinderGeometry(r,rb,h,n),mat,x,y,z);
  const ell=(x:number,y:number,z:number,rx:number,ry:number,rz:number,mat:THREE.Material,rotZ=0)=>put(new THREE.SphereGeometry(1,Math.max(rx,ry,rz)<.2?6:10,Math.max(rx,ry,rz)<.2?4:7),mat,x,y,z,new THREE.Euler(0,0,rotZ),new THREE.Vector3(rx,ry,rz));
  const line=(a:number[],b:number[],r:number,mat:THREE.Material,n=8)=>{
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),g=new THREE.CylinderGeometry(r*.78,r,v.length(),n);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));const p=av.add(bv).multiplyScalar(.5);put(g,mat,p.x,p.y,p.z);
  };
  const curve=(points:number[][],radius:number,mat:THREE.Material,segments=24)=>{put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,6,false),mat,0,0,0);};
  const ring=(r:number,t:number,mat:THREE.Material,x:number,y:number,z:number,horizontal=false)=>put(new THREE.TorusGeometry(r,t,6,40),mat,x,y,z,new THREE.Euler(horizontal?Math.PI/2:0,0,0));
  const disc=(r:number,mat:THREE.Material,x:number,y:number,z:number,rx=0)=>put(new THREE.CircleGeometry(r,40),mat,x,y,z,new THREE.Euler(rx,0,0));
  const obstacle=(id:string,x:number,z:number,w:number,d:number,height:number,minY=0,camera=true)=>{const c={id,x,z,w,d,height,minY};colliders.push(c);if(camera)viewBlockers.push({...c});};
  const floor=(id:string,x:number,z:number,w:number,d:number,top:number)=>floors.push({id,x,z,w,d,top});
  const frame=(x:number,z:number,w:number,h:number,y:number,face:number,mat=wood)=>{
    box(w,.10,.035,mat,x,y+h/2,z);box(w,.10,.035,mat,x,y-h/2,z);
    for(const s of [-1,1])box(.10,h,.04,mat,x+s*w/2,y,z);
    for(const s of [-1,1])box(.025,h-.18,.016,brass,x+s*(w/2-.115),y,z+face*.024);
  };
  const teaSet=(x:number,z:number,y:number,scale=1)=>{
    box(1.05*scale,.055,.7*scale,wood,x,y,z);box(.94*scale,.018,.59*scale,brass,x,y+.033,z);
    ell(x,y+.19,z,.16*scale,.145*scale,.145*scale,celadon);cyl(.095*scale,.09*scale,.05,celadon,x,y+.34,z);
    ell(x,y+.386,z,.028,.034,.028,brass);curve([[x+.12,y+.21,z],[x+.28,y+.22,z],[x+.33,y+.31,z]],.03*scale,celadon,8);
    ring(.095*scale,.023*scale,celadon,x-.19*scale,y+.22,z);
    for(const [dx,dz]of [[-.32,.18],[.32,.18],[-.30,-.20],[.30,-.20]]){cyl(.085*scale,.076*scale,.028,brass,x+dx*scale,y+.052,z+dz*scale);cyl(.059*scale,.044*scale,.085,ivory,x+dx*scale,y+.099,z+dz*scale);cyl(.044*scale,.044*scale,.007,soil,x+dx*scale,y+.145,z+dz*scale);}
  };
  const cabinetApron=(x:number,z:number,w:number,d:number,top:number,mat:THREE.Material)=>{
    box(w+.02,.09,d+.02,wood,x,top-.025,z);
    for(const face of [-1,1]){box(w-.10,.37,.045,mat,x,top-.245,z+face*(d/2-.03));frame(x,z+face*(d/2+.001),w-.25,.25,top-.245,face);for(let k=-1;k<=1;k++)box(.09,.09,.024,brass,x+k*w*.27,top-.245,z+face*(d/2+.025),0,Math.PI/4);}
    for(const sx of [-1,1])for(const sz of [-1,1]){box(.18,top-.27,.18,wood,x+sx*(w/2-.14),(top-.27)/2,z+sz*(d/2-.14));box(.24,.09,.24,brass,x+sx*(w/2-.14),.07,z+sz*(d/2-.14));}
  };
  // Relief landscapes are drawn on both faces of the old white screen, so the
  // underlying screen stays real and its old collider stays relevant.
  const landscapeScreen=(x:number,z:number,w:number,theme:'phoenix'|'ancestral'|'garden',height=3.4)=>{
    const panels=Math.round(w/1.45),pw=w/panels;
    for(const side of [-1,1]){
      box(w+.035,height-.12,.025,wood,x,height/2+.02,z+side*.146);
      for(let i=0;i<panels;i++){
        const px=x-w/2+(i+.5)*pw,yy=height/2+.08;
        box(pw-.16,height-.55,.018,theme==='phoenix'?red:paper,px,yy,z+side*.166);
        frame(px,z+side*.181,pw-.14,height-.53,yy,side);
        if(theme==='phoenix'){
          ring(.36,.022,brass,px,1.85,z+side*.213);box(.32,.32,.026,paleGold,px,1.85,z+side*.215,0,Math.PI/4);
          for(const sy of [-1,1])for(const sx of [-1,1])curve([[px+sx*.22,1.85+sy*.32,z+side*.215],[px+sx*.39,1.85+sy*.45,z+side*.215],[px+sx*.32,1.85+sy*.59,z+side*.215]],.017,brass,8);
        }else{
          const base=theme==='ancestral'?1.0:.85;
          // layered mountain silhouettes, clouds, and a single trained pine
          for(let k=0;k<3;k++){
            const sh=new THREE.Shape();sh.moveTo(-pw*.39,0);sh.lineTo(-pw*.36,.18+k*.11);sh.lineTo(-pw*.18,.3+k*.21);sh.lineTo(-pw*.01,.21+k*.10);sh.lineTo(pw*.18,.44+k*.12);sh.lineTo(pw*.4,.12);sh.lineTo(pw*.4,0);sh.closePath();
            put(new THREE.ShapeGeometry(sh),k%2?ink:stone,px,base+k*.23,z+side*(.195+k*.006),new THREE.Euler(0,side<0?Math.PI:0,0));
          }
          const trunkX=px-pw*.10;
          curve([[trunkX,1.05,z+side*.223],[trunkX+.08,1.7,z+side*.223],[trunkX-.06,2.4,z+side*.223],[trunkX+.18,2.76,z+side*.223]],.026,wood,12);
          for(let j=0;j<4;j++){const sy=1.55+j*.30;line([trunkX,sy,z+side*.23],[trunkX+(j%2?-.33:.38),sy+.20,z+side*.23],.018,wood);ell(trunkX+(j%2?-.31:.34),sy+.23,z+side*.23,.27,.09,.015,ink);}
          disc(.145,paleGold,px+pw*.23,2.70,z+side*.217,side<0?Math.PI:0);
        }
        // Heavy shaped feet remain within the old screen's length and shallow depth.
        for(const dx of [-pw*.36,pw*.36])box(.16,.20,.035,brass,px+dx,.18,z+side*.157);
      }
      box(w+.035,.14,.055,brass,x,height-.005,z+side*.145);
      box(w+.035,.08,.05,black,x,.18,z+side*.15);
    }
    obstacle(`screen overlay ${x},${z}`,x,z,w+.10,theme==='phoenix'?.70:.52,height+.10);
  };
  const sofa=(x:number,z:number,w:number,d:number,facing:number,seatY:number=.69)=>{
    // A complete carved settle covers the small base chair only where present.
    const face=facing>=0?1:-1;
    box(w,.20,d,wood,x,seatY-.19,z);box(w-.19,.18,d-.12,silk,x,seatY,z);
    for(const a of [-1,1])for(const b of [-1,1]){box(.15,seatY-.25,.15,wood,x+a*(w/2-.15),(seatY-.25)/2,z+b*(d/2-.15));box(.20,.08,.20,brass,x+a*(w/2-.15),.07,z+b*(d/2-.15));}
    box(w,1.1,.14,wood,x,seatY+.49,z-face*(d/2-.07));box(w-.27,.77,.05,silk,x,seatY+.52,z-face*(d/2-.15));
    for(const s of [-1,1]){box(.13,.48,d,wood,x+s*(w/2-.06),seatY+.20,z);box(.17,.085,d+.025,brass,x+s*(w/2-.06),seatY+.49,z);ell(x+s*w*.27,seatY+.29,z-face*.22,w*.14,.28,.15,silkLight,s*.15);}
    box(w+.04,.09,.19,brass,x,seatY+1.02,z-face*(d/2-.07));
    for(const px of [-.28,0,.28])box(w*.16,.045,.03,paleGold,x+px*w,seatY+.52,z-face*(d/2-.18));
  };
  const vase=(x:number,z:number,y:number,h:number,flowers=false)=>{
    const points=[[0,0],[.24,0],[.28,.1],[.37,.34],[.34,.61],[.16,.76],[.14,.90],[.21,.95]].map(([r,yy])=>new THREE.Vector2(r*h,yy*h));
    put(new THREE.LatheGeometry(points,20),celadon,x,y,z);ring(.19*h,.027*h,brass,x,y+h*.94,z,true);
    if(flowers)for(let i=0;i<7;i++){
      const angle=i*2.399,dx=Math.cos(angle)*h*.47,dz=Math.sin(angle)*h*.31,fy=y+h*(1.6+(i%3)*.15);
      curve([[x,y+h*.85,z],[x+dx*.4,y+h*1.3,z+dz*.5],[x+dx,fy,z+dz]],.015,wood,10);
      for(let j=0;j<5;j++){const a=j/5*Math.PI*2;ell(x+dx+Math.cos(a)*.085,fy+Math.sin(a)*.07,z+dz,.092,.09,.035,pink,a);}
      ell(x+dx,fy,z+dz+.035,.032,.032,.027,paleGold);
    }
  };
  if(zone==='empress'){
    // A three-step low reception platform; the existing central table becomes a
    // low audience console above it. It does not intrude into the north gate lane.
    for(const [id,w,d,cz,top]of [['main dais',10.9,5.7,-16.55,.36],['middle step',9.6,.48,-13.46,.24],['lower step',8.5,.50,-12.97,.12]] as const){
      box(w,top-.025,d,stone,0,(top+.025)/2,cz);box(w,.028,d,wood,0,top-.014,cz);floor(id,0,cz,w,d,top);
      for(const sz of [-1,1])box(w-.07,.036,.016,brass,0,top-.065,cz+sz*(d/2+.003));
    }
    box(6.6,.012,5.3,silk,0,.369,-16.5);floor('dais silk carpet',0,-16.5,6.6,5.3,.375);
    for(const x of [-3.22,3.22])box(.055,.006,5.25,paleGold,x,.378,-16.5);
    landscapeScreen(0,-18,11,'phoenix',4.75);
    // Golden phoenix disk and deliberately sweeping paired feather fans.
    for(const side of [-1,1]){
      disc(1.10,wood,0,3.20,-18+side*.246,side<0?Math.PI:0);ring(1.05,.055,brass,0,3.20,-18+side*.269);
      for(const wing of [-1,1])for(let i=0;i<7;i++){
        const angle=.19+i*.16,r=1.01-i*.047;
        curve([[wing*.10,3.07,-18+side*.296],[wing*.44,3.33,-18+side*.296],[wing*Math.cos(angle)*r,3.20+Math.sin(angle)*r,-18+side*.296]],.033,brass,10);
      }
      curve([[0,2.65,-18+side*.30],[.22,3.10,-18+side*.30],[-.12,3.50,-18+side*.30],[.04,3.69,-18+side*.30]],.055,paleGold,18);
      for(const dx of [-.32,0,.32])curve([[0,3.1,-18+side*.30],[dx*.4,2.72,-18+side*.30],[dx,2.55,-18+side*.30]],.029,brass,10);
      ell(.065,3.68,-18+side*.31,.09,.065,.032,brass);
    }
    sofa(0,-17,2.6,1.42,1,.98);obstacle('empress reception seat',0,-17,2.65,1.48,2.2);
    cabinetApron(0,-15,4,1.6,1.24,red);box(2.3,.02,1.25,silk,0,1.26,-15);teaSet(0,-14.92,1.29,.9);
    // Canopy framework is structural, highly visible, and clear above 2.4 m.
    const leftRight=[-4.8,4.8],backFront=[-18.2,-14.0];
    for(const x of leftRight)for(const z of backFront){
      cyl(.19,.22,5.14,red,x,2.94,z,20);cyl(.30,.34,.20,stone,x,.48,z);cyl(.24,.24,.10,brass,x,.66,z);
      for(const y of [1.05,4.94,5.35])cyl(.21,.21,.07,brass,x,y,z);
      obstacle(`empress canopy post ${x},${z}`,x,z,.68,.68,5.75);
    }
    box(10.24,.20,4.96,wood,0,5.52,-16.1);box(9.78,.09,4.52,silk,0,5.67,-16.1);
    for(const x of [-5.02,5.02]){box(.18,.34,4.96,red,x,5.7,-16.1);box(.20,.04,5.0,brass,x,5.88,-16.1);}
    for(const z of [-18.5,-13.70]){box(10.24,.34,.18,red,0,5.7,z);box(10.29,.045,.20,brass,0,5.88,z);box(10.04,.04,.13,paleGold,0,5.55,z+.11);}
    // Stretched silk valance with shallow scalloped lower edge, not box curtains.
    const shape=new THREE.Shape();shape.moveTo(-4.80,5.50);shape.lineTo(4.80,5.50);shape.lineTo(4.80,4.88);
    for(let i=64;i>=0;i--){const x=-4.8+i/64*9.6;shape.lineTo(x,4.92-.22*Math.abs(Math.sin((x+4.8)/9.6*Math.PI*3)));}shape.closePath();
    put(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,curveSegments:1}),silk,0,0,-13.60);
    const hem:number[][]=[];for(let i=0;i<=48;i++){const x=-4.8+i/48*9.6;hem.push([x,4.92-.22*Math.abs(Math.sin((x+4.8)/9.6*Math.PI*3)),-13.525]);}curve(hem,.029,paleGold,64);
    for(const x of [-4.60,4.60]){
      for(let i=0;i<5;i++){const xx=x+(i-2)*.10;box(.13,2.76,.09,i%2?silk:red,xx,3.98,-13.63);}
      box(.57,.11,.14,brass,x,3.34,-13.54);
      for(const z of [-18.25,-13.63]){ell(x,5.92,z,.11,.15,.11,brass);}
      viewBlockers.push({id:`empress gathered curtain ${x}`,x,z:-13.63,w:.58,d:.22,minY:2.60,height:5.43});
    }
    viewBlockers.push({id:'empress canopy roof',x:0,z:-16.1,w:10.28,d:4.99,minY:5.36,height:6.08},{id:'empress canopy valance',x:0,z:-13.58,w:9.6,d:.15,minY:4.67,height:5.52});
    // Side salon islands are arranged around existing screens and benches.
    for(const x of [-12,12]){
      landscapeScreen(x,5,7,'phoenix');cabinetApron(x,-6,3.5,1.6,1.24,red);teaSet(x-.48,-5.87,1.27,.75);
      sofa(x,-4.3,1.14,.73,-1,.66);obstacle(`empress side chair ${x}`,x,-4.3,1.19,.79,1.77);
      box(6.65,.014,11.0,silkLight,x,.038,11.6);floor(`empress salon rug ${x}`,x,11.6,6.65,11,.045);
      for(const z of [11,15]){sofa(x<0?-13:13,z,2.4,1.17,z===11?1:-1,.63);obstacle(`empress salon settle ${x},${z}`,x<0?-13:13,z,2.44,1.21,1.76);}
      // Side tea table uses only the rug's already arranged seating interior.
      const tx=x<0?-13:13;cabinetApron(tx,13,1.55,.90,.66,red);teaSet(tx,13,.71,.70);obstacle(`empress salon tea ${x}`,tx,13,1.59,.94,1.12);
    }
  }else if(zone==='dowager'){
    // A taller, deliberate ancestral backdrop set into the original screen line.
    landscapeScreen(0,-19,9,'ancestral',4.35);
    box(8.9,.15,.36,wood,0,4.52,-19);box(9.1,.08,.39,brass,0,4.63,-19);
    viewBlockers.push({id:'dowager ancestral cornice',x:0,z:-19,w:9.14,d:.42,minY:4.39,height:4.70});
    for(const x of [-3.55,0,3.55]){
      box(1.45,1.15,.08,wood,x,3.54,-18.70);frame(x,-18.63,1.25,.98,3.54,1,brass);
      // Seal-like architectural motifs; no invented historical text.
      box(.43,.43,.04,brass,x,3.54,-18.56,0,Math.PI/4);box(.20,.20,.04,wood,x,3.54,-18.525,0,Math.PI/4);
    }
    cabinetApron(0,-17,4.5,1.5,1.24,wood);box(3.0,.02,1.28,silk,0,1.26,-17);
    for(const x of [-1.4,0,1.4]){
      box(.76,.15,.48,wood,x,1.35,-17.13);box(.67,1.22,.24,wood,x,1.99,-17.10);frame(x,-16.958,.49,.94,2.01,1,brass);
      box(.13,.60,.028,brass,x,2.0,-16.928);box(.28,.09,.028,brass,x,2.25,-16.925);
    }
    // Incense censer, candles and offerings occupy the original shrine tabletop.
    ell(0,1.48,-16.50,.32,.17,.22,brass);cyl(.17,.27,.10,wood,0,1.33,-16.50);
    for(const dx of [-.10,0,.10])line([dx,1.60,-16.50],[dx,2.03,-16.50],.009,wood,5);
    for(const x of [-1.93,1.93]){cyl(.13,.20,.11,brass,x,1.31,-16.55);cyl(.04,.06,.45,brass,x,1.57,-16.55);cyl(.065,.065,.31,ivory,x,1.95,-16.55);}
    for(const x of [-5,5]){
      vase(x,-14,.05,1.42,true);
      // The original broad urn is preserved underneath a properly shaped sleeve.
      put(new THREE.LatheGeometry([[.67,0],[.68,.12],[.63,.28],[.615,.65],[.56,1.02],[.51,1.30],[.54,1.39]].map(([r,y])=>new THREE.Vector2(r,y)),24),celadon,x,.025,-14);
      ring(.665,.035,brass,x,.17,-14,true);ring(.532,.027,brass,x,1.405,-14,true);
      for(let i=0;i<12;i++){const a=i*Math.PI/6;curve([[x+Math.cos(a)*.64,.28,-14+Math.sin(a)*.64],[x+Math.cos(a)*.62,.64,-14+Math.sin(a)*.62],[x+Math.cos(a)*.563,1.02,-14+Math.sin(a)*.563]],.014,brass,8);}
      obstacle(`dowager plum vessel ${x}`,x,-14,1.56,1.42,3.48);
    }
    for(const x of [-12,12]){
      landscapeScreen(x,-8,5,'ancestral');
      // Four-post panel ends visually close the far side of the tea salon.
      for(const side of [-1,1])box(.18,3.44,.24,wood,x+side*2.38,1.75,-8);
      box(6.75,.018,7.85,silk,x,.04,7.45);floor(`dowager tea salon rug ${x}`,x,7.45,6.75,7.85,.049);
      for(const sx of [-1,1])box(.045,.007,7.72,paleGold,x+sx*3.22,.055,7.45);
      sofa(x,5.60,4.15,1.40,1,.70);obstacle(`dowager north settle ${x}`,x,5.6,4.20,1.46,1.85);
      sofa(x,10,2.70,1.25,-1,.70);obstacle(`dowager south settle ${x}`,x,10,2.75,1.31,1.85);
      cabinetApron(x,8,2.8,1.4,1.24,wood);box(1.75,.024,1.06,silkLight,x,1.27,8);teaSet(x-.42,8,1.30,.85);
      // Porcelain fruit dish and modest book stack are balanced against the tea set.
      cyl(.28,.20,.09,ivory,x+.80,1.33,8.15);for(let k=0;k<4;k++)ell(x+.65+(k%2)*.20,1.42,8.04+Math.floor(k/2)*.17,.095,.09,.095,paleGold);
      box(.59,.08,.40,paper,x+.74,1.30,7.65);box(.62,.035,.43,silk,x+.74,1.36,7.65);
      // Narrow lantern pedestal stays outside the table, inside this occupied island.
      const px=x+(x<0?-2.62:2.62);box(.70,.12,.70,wood,px,.1,7.5);box(.45,.82,.45,wood,px,.56,7.5);
      box(.72,.1,.72,brass,px,1.03,7.5);box(.5,.78,.5,ivory,px,1.47,7.5);box(.73,.10,.73,wood,px,1.92,7.5);
      for(const dx of [-.27,.27])for(const dz of [-.27,.27])box(.05,.88,.05,wood,px+dx,1.48,7.5+dz);
      obstacle(`dowager salon lantern ${x}`,px,7.5,.75,.75,2.01);
    }
  }else{
    // Textured-looking stone route replaces the visual reading of the broad silk
    // runner without deleting it. Ground metadata makes its 0.13m top explicit.
    for(let z=-16.5;z<=16.5;z+=1.50){
      for(const side of [-1,1])box(1.63,.022,1.44,(Math.round(z*2)+side)%3?path:stone,side*.84,.127,z);
    }
    floor('ladies central stone walk',0,0,3.36,34.5,.138);
    for(const z of [-12,12]){
      for(let x=-14;x<=14;x+=1.55)box(1.48,.019,1.40,(Math.round(x*10)%3)?path:stone,x,.038,z);
      floor(`ladies crosswalk ${z}`,0,z,29.5,1.4,.0475);
    }
    // Pond builds upon the existing small fountain footprint. Lotus and scholar's
    // rock turn it into a visible garden landmark while keeping all routes around it.
    cyl(1.46,1.46,.16,stone,0,.43,-9,40);cyl(1.29,1.29,.055,water,0,.536,-9,40);ring(1.38,.11,ivory,0,.55,-9,true);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(.20,.09,.16,brass,Math.cos(a)*1.40,.51,-9+Math.sin(a)*1.40,-a);}
    for(let i=0;i<6;i++){
      const a=i*2.399,r=.53+(i%2)*.38,x=Math.cos(a)*r,z=-9+Math.sin(a)*r;
      cyl(.17,.17,.009,leaf,x,.575,z,14);line([x,.575,z],[x+.03,.82,z+.035],.012,leaf);
      for(let j=0;j<6;j++){const t=j*Math.PI/3;ell(x+Math.cos(t)*.065,.79+Math.sin(t)*.025,z+Math.sin(t)*.065,.09,.065,.035,i%2?ivory:pink,t);}
      ell(x,.82,z,.035,.035,.03,paleGold);
    }
    const rock=(x:number,y:number,z:number,sx:number,sy:number,sz:number,rz=0)=>put(new THREE.DodecahedronGeometry(1,0),stone,x,y,z,new THREE.Euler(.22,.31,rz),new THREE.Vector3(sx,sy,sz));
    rock(.29,.93,-9.26,.40,.57,.29,-.14);rock(.42,1.43,-9.35,.22,.52,.21,.2);rock(.12,1.69,-9.36,.30,.18,.21,-.35);
    obstacle('ladies lotus pond and rock',0,-9,3,3,1.95);
    for(const x of [-9,9])for(const z of [-7,7]){
      // The base world planter remains. This measured cap stays within 3.2m.
      box(3.10,.10,3.10,wood,x,.48,z);box(2.84,.075,2.84,soil,x,.52,z);
      for(const s of [-1,1]){box(3.18,.14,.14,stone,x,.57,z+s*1.51);box(.14,.14,3.18,stone,x+s*1.51,.57,z);}
      for(let i=0;i<14;i++){
        const a=i*2.399,rr=.65+(i%3)*.26,xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;
        ell(xx,.75+(i%2)*.08,zz,.24,.20,.27,i%3?leaf:leafLight,a);
        if(i%3===0)for(let j=0;j<5;j++){const b=j*Math.PI*2/5;ell(xx+Math.cos(b)*.07,.96,zz+Math.sin(b)*.07,.09,.055,.09,pink);}
      }
      const flowering=(x<0&&z<0)||(x>0&&z>0);
      if(flowering){
        // A single twisting trunk and radiating jointed branches, with individual
        // leaves/blossoms. No giant stacked spheres masquerading as a tree.
        curve([[x+.13,.53,z-.12],[x+.03,1.3,z-.08],[x-.13,2.0,z],[x+.03,2.7,z-.12],[x-.04,3.46,z-.08]],.09,wood,20);
        for(let i=0;i<11;i++){
          const a=i*2.399,r=.67+(i%3)*.22,by=1.90+(i%4)*.31,tx=x+Math.cos(a)*r,tz=z+Math.sin(a)*r,ty=by+.63;
          curve([[x,by-.50,z],[x+Math.cos(a)*r*.45,by+.02,z+Math.sin(a)*r*.5],[tx,ty,tz]],.035,wood,10);
          for(let j=0;j<6;j++){
            const b=a+j*2.399,rr=.10+(j%2)*.15,xx=tx+Math.cos(b)*rr,zz=tz+Math.sin(b)*rr,yy=ty+(j%3)*.12;
            ell(xx,yy-.07,zz,.16,.055,.075,leafLight,b);
            for(let k=0;k<5;k++){const c=k*Math.PI*2/5;ell(xx+Math.cos(c)*.075,yy+.045,zz+Math.sin(c)*.075,.10,.075,.055,k%2?pink:ivory,c);}
            ell(xx,yy+.10,zz,.022,.026,.022,paleGold);
          }
        }
        obstacle(`ladies flowering planter ${x},${z}`,x,z,3.2,3.2,3.95);
      }else{
        rock(x+.52,1.04,z-.40,.60,.72,.40,.14);rock(x+.28,1.67,z-.46,.28,.48,.24,-.25);
        for(let i=0;i<5;i++){
          const xx=x-.80+i*.19,zz=z+.28-(i%2)*.22,h=1.2+i*.18;
          line([xx,.60,zz],[xx+.09,.60+h,zz],.022,ink,7);
          for(let k=0;k<4;k++){const yy=.9+k*h/4;for(const s of [-1,1]){line([xx,yy,zz],[xx+s*.24,yy+.18,zz],.009,ink,5);ell(xx+s*.25,yy+.19,zz,.18,.035,.06,leaf,s*.5);}}
        }
        obstacle(`ladies rock and bamboo planter ${x},${z}`,x,z,3.2,3.2,2.9);
      }
    }
    // Existing garden privacy screens become painted garden screens. Pavilion
    // guqin tables and residential interiors are deliberately untouched.
    for(const x of [-15,15])landscapeScreen(x,10,5,'garden');
    // A clearly readable eave silhouette around the real open court; all above
    // headroom. There is NO sky plane or fake overhead ceiling over the courtyard.
    for(const x of [-10.5,10.5]){
      box(.26,.42,39.6,wood,x,6.02,0);box(.31,.075,39.6,celadon,x,5.79,0);
      for(let z=-19.5;z<=19.5;z+=1.50){box(.75,.14,.22,wood,x+(x<0?.26:-.26),5.85,z);cyl(.09,.09,.12,brass,x+(x<0?.46:-.46),5.76,z,10);}
      viewBlockers.push({id:`ladies open courtyard eave ${x}`,x,z:0,w:.99,d:39.6,minY:5.70,height:6.25});
    }
  }
  // Material buckets keep all small relief, tea and foliage details inexpensive.
  for(const [material,parts]of buckets){
    const geo=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geo)continue;geo.computeBoundingBox();geo.computeBoundingSphere();geometries.push(geo);
    const mesh=new THREE.Mesh(geo,material);mesh.name=material.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);stats.drawCalls++;stats.triangles+=geo.getAttribute('position').count/3;
  }
  // Only retained material batches count and own resources; unused palette entries
  // are disposed immediately rather than sitting alive on every streamed zone.
  for(let i=materials.length-1;i>=0;i--)if(!buckets.has(materials[i])){materials[i].dispose();materials.splice(i,1);}
  stats.materials=materials.length;stats.geometries=geometries.length;
  root.userData={zone,units:'metres',design:'Original room-specific imperial interior and garden composition',stats,physics:{colliders,viewBlockers,floors}};
  scene.add(root);return result;
}
