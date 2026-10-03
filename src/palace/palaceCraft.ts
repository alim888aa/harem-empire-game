import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type CraftedZone = 'library' | 'emperor' | 'empress' | 'ladies' | 'dowager';
export interface PalaceCraftOptions { software?: boolean; furnishings?: boolean; ceiling?: boolean }
export interface PalaceCraftStats { drawCalls: number; triangles: number; wallBays: number; bracketSets: number; shelfCases: number }
const DEFS = {
  library: { x:17, north:-20, south:20, h:6.8, accent:'#496c64', textile:'#435b59' },
  emperor: { x:23.8, north:-28, south:24, h:8.8, accent:'#8c4237', textile:'#793c37' },
  empress: { x:18, north:-22, south:20, h:7.4, accent:'#935752', textile:'#826066' },
  ladies: { x:20, north:-28, south:20, h:6.4, accent:'#628272', textile:'#668077' },
  dowager: { x:17, north:-23, south:20, h:7.2, accent:'#676278', textile:'#625b72' },
} as const;

/**
 * Original Forbidden City-inspired interior craft. Not a measured restoration.
 * One metre per unit, +Y up, original world coordinates. Add AFTER base world batching.
 * Perimeter additions project <= 0.35m from original wall centres, within the existing
 * avatar clearance. Existing four 4.4m doorways stay open. Furnishing overlays use existing collision footprints plus <=0.035m
 * shallow trim, well inside the existing 0.4m actor margin. No lights, colliders, player state or borrowed resources.
 * Ceiling joinery bottoms are >= 5.2m; low overhead detail never crosses a gate.
 */
export function addPalaceCraft(scene: THREE.Scene, zone: CraftedZone, options: PalaceCraftOptions = {}) {
  const root = new THREE.Group(); root.name = `PalaceCraft:${zone}`;
  const stats: PalaceCraftStats = { drawCalls:0, triangles:0, wallBays:0, bracketSets:0, shelfCases:0 };
  const ownedMaterials: THREE.MeshStandardMaterial[] = [];
  const ownedGeometries: THREE.BufferGeometry[] = [];
  let disposed = false;
  const dispose=()=>{ if(disposed)return; disposed=true;root.removeFromParent();ownedGeometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());root.clear(); };
  if(options.software)return {root, stats, dispose};
  const def=DEFS[zone];
  const mat=(name:string,color:string,roughness=.75,metalness=0,emissive?:string)=>{
    const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness,emissive:emissive??'#000000',emissiveIntensity:emissive?.32:0});
    ownedMaterials.push(m);return m;
  };
  const walnut=mat('Craft • smoked elm','#493326',.71);
  const wood=mat('Craft • warm elm','#76503a',.64);
  const lacquer=mat('Craft • mineral lacquer',def.accent,.55);
  const dark=mat('Craft • recessed timber','#292e2c',.9);
  const teal=mat('Craft • blue-green beam paint','#426768',.8);
  const ivory=mat('Craft • aged silk & plaster','#dbceb0',.9);
  const paper=mat('Craft • warm paper','#eee0bc',.85);
  const stone=mat('Craft • carved limestone','#b9aa8b',.88);
  const gold=mat('Craft • quiet brass','#b29964',.42,.38);
  const window=mat('Craft • translucent daylight paper','#d7e5d7',.85,0,'#d3e8df');
  // Ceremonial dimming must dim window-looking surfaces along with real lights.
  // Emperor windows deliberately have zero self-emission; no bright slabs at 24%.
  window.emissiveIntensity=zone==='emperor'?0:.06;
  const blue=mat('Craft • indigo book cloth','#364d61',.86);
  const sage=mat('Craft • sage book cloth','#688377',.86);
  const rust=mat('Craft • cinnabar book cloth','#9a5646',.86);
  const fabric=mat('Craft • woven textile',def.textile,.95);
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const matrix=new THREE.Matrix4(),rot=new THREE.Quaternion();
  const put=(geo:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,ry=0,rz=0)=>{
    rot.setFromEuler(new THREE.Euler(0,ry,rz));matrix.compose(new THREE.Vector3(x,y,z),rot,new THREE.Vector3(1,1,1));
    const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();g.applyMatrix4(matrix);
    const b=buckets.get(m)??[];b.push(g);buckets.set(m,b);
  };
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,ry=0,rz=0)=>put(new THREE.BoxGeometry(w,h,d),m,x,y,z,ry,rz);
  const cyl=(rt:number,rb:number,h:number,m:THREE.Material,x:number,y:number,z:number,ry=0,rz=0,n=12)=>put(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z,ry,rz);
  const strip=(a:THREE.Vector3,b:THREE.Vector3,width:number,depth:number,m:THREE.Material)=>{
    const mid=a.clone().add(b).multiplyScalar(.5),delta=b.clone().sub(a);const g=new THREE.BoxGeometry(width,delta.length(),depth);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));put(g,m,mid.x,mid.y,mid.z);
  };
  // Applied joinery uses a local coordinate frame: u along wall; p into room.
  const wallRun=(cx:number,cz:number,length:number,ry:number,h=def.h)=>{
    const point=(u:number,y:number,p:number)=>new THREE.Vector3(cx+u*Math.cos(ry)+p*Math.sin(ry),y,cz-u*Math.sin(ry)+p*Math.cos(ry));
    const wb=(w:number,bh:number,d:number,m:THREE.Material,u:number,y:number,p=.225)=>{const q=point(u,y,p);box(w,bh,d,m,q.x,q.y,q.z,ry);};
    wb(length-.08,.20,.11,stone,0,.15);
    wb(length-.10,.12,.13,walnut,0,.34);
    wb(length-.10,.12,.14,walnut,0,1.37);
    wb(length-.10,.22,.13,walnut,0,h-.87);
    wb(length-.12,.10,.12,gold,0,h-.99);
    wb(length-.12,.38,.07,teal,0,h-.53);
    const n=Math.max(1,Math.round(length/2.5)),bw=(length-.18)/n;
    for(let i=0;i<n;i++){
      const u=-length/2+.09+bw*(i+.5);stats.wallBays++;
      wb(bw-.14,.88,.035,lacquer,u,.86,.20);
      wb(bw-.38,.58,.05,wood,u,.85,.232);
      // Framed field rather than gold glued to every surface.
      for(const s of [-1,1]){wb(.055,.72,.06,walnut,u+s*(bw-.3)/2,.85);wb(bw-.27,.042,.06,walnut,u,.85+s*.35);}
      const top=h-1.03,bottom=1.52,wh=top-bottom,y=(top+bottom)/2;
      wb(bw-.13,wh,.04,walnut,u,y,.203);
      // In each run, measured alternating windows and opaque painted screens.
      const isWindow=(i%3!==1);wb(bw-.31,wh-.19,.027,isWindow?window:ivory,u,y,.227);
      for(const s of [-1,1]){wb(.09,wh+.04,.12,walnut,u+s*(bw-.08)/2,y);wb(bw-.04,.09,.12,walnut,u,y+s*wh/2);}
      const innerW=bw-.32;
      if(isWindow){
        const cell=innerW/4;
        for(let col=1;col<4;col++)wb(.035,wh-.20,.048,wood,u-innerW/2+col*cell,y,.274);
        const rows=Math.max(3,Math.round((wh-.20)/cell));
        for(let row=1;row<rows;row++)wb(innerW,.032,.048,wood,u,bottom+.1+row*(wh-.2)/rows,.274);
        // A few centered inset squares make a joinery rhythm, with generous calm spaces.
        for(let row=1;row<rows-1;row+=2)for(let col=0;col<4;col++)if((row+col)%2===1){
          const yy=bottom+.1+(row+.5)*(wh-.2)/rows,uu=u-innerW/2+(col+.5)*cell,k=cell*.40;
          for(const s of [-1,1]){wb(.025,k,.052,wood,uu+s*k/2,yy,.285);wb(k,.025,.052,wood,uu,yy+s*k/2,.285);}
        }
      }else{
        // Simple framed silk painting: stylized hills and bamboo, geometry not a decal.
        wb(innerW*.73,wh*.74,.018,paper,u,y,.254);
        const left=u-innerW*.26,base=bottom+wh*.28;
        for(let k=0;k<4;k++){
          const xx=left+k*innerW*.15,stemH=wh*(.34+(k%2)*.09);
          wb(.018,stemH,.024,sage,xx,base+stemH/2,.278);
          for(let t=0;t<3;t++){
            const a=point(xx,base+stemH*(.28+t*.23),.285),b=point(xx+((t+k)%2?1:-1)*innerW*.17,base+stemH*(.42+t*.23),.285);
            strip(a,b,.045,.015,sage);
          }
        }
        wb(innerW*.12,.11,.025,rust,u+innerW*.23,bottom+wh*.19,.286);
      }
      wb(bw-.25,.19,.065,lacquer,u,h-.53,.236);
      for(const s of [-1,1])wb(.045,.24,.075,gold,u+s*(bw-.27)/2,h-.53,.248);
    }
  };
  // The old door gaps are +/-2.2m about -6 north, +6 south and 0 side walls.
  const north=def.north,south=def.south,x=def.x;
  for(const [z,gap,ry] of [[north,-6,0],[south,6,Math.PI]]){
    const left=gap-2.25+x,right=x-gap-2.25;
    wallRun((-x+gap-2.25)/2,z,left,ry);
    wallRun((gap+2.25+x)/2,z,right,ry);
  }
  for(const [wx,ry] of [[-x,Math.PI/2],[x,-Math.PI/2]]){
    const a=(-2.25-north),b=(south-2.25);
    wallRun(wx,(north-2.25)/2,a,ry);
    wallRun(wx,(south+2.25)/2,b,ry);
  }
  // Ladies' occupied north wing has a separate courtyard-facing facade at z=-20.
  // Keep the two chamber entrances and through-gallery open at -14, -6 and +10.
  if(zone==='ladies'){
    let cursor=-20;
    for(const door of [-14,-6,10]){
      const end=door-2.25;if(end>cursor)wallRun((cursor+end)/2,-20,end-cursor,0);
      cursor=door+2.25;
    }
    if(cursor<20)wallRun((cursor+20)/2,-20,20-cursor,0);
  }
  // Portal casing is physically above / outside, never inside the clear opening.
  for(const [cx,cz,ry] of [[-6,north,0],[6,south,Math.PI],[-x,0,Math.PI/2],[x,0,-Math.PI/2]]){
    const point=(u:number,y:number,p:number)=>new THREE.Vector3(cx+u*Math.cos(ry)+p*Math.sin(ry),y,cz-u*Math.sin(ry)+p*Math.cos(ry));
    for(const s of [-1,1]){const q=point(s*2.28,1.7,.235);box(.13,3.4,.14,walnut,q.x,q.y,q.z,ry);}
    for(const [w,h,y,m] of [[4.7,.18,3.58,walnut],[4.8,.16,3.77,teal],[4.8,.025,3.88,gold]] as const){const q=point(0,y,.24);box(w,h,.15,m,q.x,q.y,q.z,ry);}
    const q=point(0,4.14,.235);box(1.7,.43,.1,walnut,q.x,q.y,q.z,ry);
    // Framed plaque with abstract seal motifs rather than fake illegible writing.
    for(const s of [-1,1]){const p=point(s*.33,4.14,.30);box(.19,.19,.025,gold,p.x,p.y,p.z,ry,Math.PI/4);}
  }
  const bracketShape=(w:number,h:number,d:number)=>{
    const s=new THREE.Shape();s.moveTo(-w/2,h*.7);s.lineTo(w/2,h*.7);s.lineTo(w/2,h*.2);
    s.lineTo(w*.36,h*.2);s.lineTo(w*.27,-h*.18);s.lineTo(-w*.27,-h*.18);s.lineTo(-w*.36,h*.2);s.lineTo(-w/2,h*.2);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,steps:1,curveSegments:1});g.translate(0,0,-d/2);return g;
  };
  // Emperor already owns a richer central colonnade in hallDetails; don't stack it.
  if(zone!=='emperor')for(const cx of [-10,10])for(const cz of [-12,10]){
    stats.bracketSets++;const h=def.h;
    cyl(.326,.337,.17,stone,cx,.30,cz);cyl(.307,.319,h-.90,lacquer,cx,(h-.90)/2+.39,cz,0,0,20);
    cyl(.327,.327,.055,walnut,cx,.51,cz);cyl(.326,.326,.045,gold,cx,h-1.0,cz);
    for(let k=0;k<3;k++)for(const ry of [0,Math.PI/2]){
      put(bracketShape(.90+k*.32,.26,.20),k===1?lacquer:teal,cx,h-.72+k*.18,cz,ry);
      box(.76+k*.32,.035,.22,gold,cx,h-.55+k*.18,cz,ry);
    }
  }
  // Coffers use the actual ceiling height. Open Ladies court receives no roof.
  if(options.ceiling!==false){
    const ceilings: [number,number,number,number,number][] = zone==='ladies' ? [[-15,0,9,40,def.h],[15,0,9,40,def.h],[0,-24,40,8,def.h]] : zone==='emperor' ? [[0,8,47.6,31,7.2],[0,-18,47.6,20,9.0]] : [[0,(north+south)/2,x*2,south-north,def.h]];
    for(const [cx,cz,w,d,h] of ceilings){
      const nx=Math.max(2,Math.round(w/4)),nz=Math.max(2,Math.round(d/4)),dx=w/nx,dz=d/nz;
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
        const px=cx-w/2+(i+.5)*dx,pz=cz-d/2+(j+.5)*dz;
        // Wide calm timber/silk fields set off relatively fine joinery.
        box(dx-.10,.055,dz-.10,ivory,px,h-.09,pz);
        for(const s of [-1,1]){
          box(dx-.22,.07,.07,wood,px,h-.15,pz+s*(dz-.27)/2);
          box(.07,.07,dz-.22,wood,px+s*(dx-.27)/2,h-.15,pz);
        }
        // Small repeated painted corner blocks, no random gold stars.
        for(const sx of [-1,1])for(const sz of [-1,1])box(.32,.06,.32,teal,px+sx*(dx-.66)/2,h-.19,pz+sz*(dz-.66)/2);
      }
      for(let i=0;i<=nx;i++)box(.15,.21,d,walnut,cx-w/2+i*dx,h-.16,cz);
      for(let j=0;j<=nz;j++)box(w,.21,.15,walnut,cx,h-.16,cz-d/2+j*dz);
      // A structural blue-green fascia and a brass hairline at clear headroom.
      for(const px of [-10,10])if(px>cx-w/2+.4&&px<cx+w/2-.4){
        box(.36,.43,d-.2,teal,px,h-.37,cz);
        for(const s of [-1,1])box(.018,.035,d-.24,gold,px+s*.186,h-.48,cz);
      }
    }
  }
  const tableDress=(tx:number,tz:number,w:number,d:number)=>{
    // Fine apron/edge overlays stay on the existing table, not in walking space.
    box(w+.012,.046,d+.012,walnut,tx,1.19,tz);
    for(const s of [-1,1])box(w-.12,.17,.09,wood,tx,.98,tz+s*(d/2-.09));
    box(w*.54,.015,d*.68,fabric,tx,1.225,tz);
    box(.51,.025,.36,paper,tx+.23,1.246,tz);
    box(.42,.034,.31,blue,tx-.42,1.25,tz+.12);
    box(.08,.018,.23,gold,tx-.41,1.275,tz+.13);
    // Brush rest, inkstone, two cups; no effects or material texture downloads.
    box(.20,.045,.13,dark,tx+.58,1.263,tz-.20);
    cyl(.055,.038,.10,ivory,tx-.70,1.28,tz-.2);
    cyl(.062,.058,.022,gold,tx-.70,1.332,tz-.2);
  };
  if(options.furnishings!==false){
    if(zone==='library'){
      for(const sx of [-14,14,-7,7])for(const sz of [-13,-6,7,14]){
        stats.shelfCases++;
        // Original .65 x 3.3 x 3.6 bookcase receives two readable open fronts.
        // Max width 1.086 < existing 1.1 collider. End veneer projects 0.029m
        // beyond the 3.6m depth, inside the existing 0.4m actor margin.
        box(.73,.14,3.58,walnut,sx,3.39,sz);box(.84,.09,3.57,wood,sx,3.49,sz);
        box(.88,.17,3.57,walnut,sx,.34,sz);
        for(const end of [-1,1]){
          box(.67,3.02,.024,walnut,sx,1.90,sz+end*1.812);
          box(.51,2.62,.026,lacquer,sx,1.91,sz+end*1.816);
          box(.38,2.43,.022,wood,sx,1.91,sz+end*1.820);
          for(const side of [-1,1])box(.028,2.54,.024,gold,sx+side*.222,1.91,sz+end*1.824);
        }
        for(const face of [-1,1]){
          const fx=sx+face*.405;
          for(const zz of [-1.67,0,1.67])box(.18,3.08,.12,wood,fx,1.90,sz+zz);
          for(const y of [.61,1.26,1.91,2.56,3.20])box(.21,.072,3.35,walnut,fx,y,sz);
          for(let row=0;row<4;row++)for(let bay=0;bay<2;bay++){
            const y=.65+row*.65,zz=sz+(bay===0?-.83:.83),color=[blue,sage,rust][(row+bay+(sx>0?1:0))%3];
            for(let book=0;book<4;book++){
              const bz=zz-.55+book*.30,bh=.34+(book%3)*.045;
              box(.17,bh,.235,color,sx+face*.44,y+bh/2,bz);
              box(.018,.027,.20,gold,sx+face*.532,y+bh*.73,bz);
              box(.018,.10,.12,paper,sx+face*.534,y+bh*.45,bz);
            }
          }
        }
      }
      for(const sx of [-3.5,3.5])tableDress(sx,-12,2.2,1.4);tableDress(0,7,4,1.7);
      for(const [cx,cz] of [[-3.5,-10.5],[3.5,-10.5],[0,9]]){
        box(.67,.038,.59,fabric,cx,.641,cz);
        for(const face of [-1,1]){
          const z=cz-.3+face*.063;
          box(.72,.79,.024,walnut,cx,1,z);
          box(.50,.58,.024,wood,cx,1.01,z+face*.014);
          box(.16,.43,.026,lacquer,cx,1.01,z+face*.028);
        }
        box(.73,.095,.14,wood,cx,1.395,cz-.3);
        for(const dx of [-.29,.29])box(.07,.36,.07,wood,cx+dx,.39,cz-.22);
      }
    }else if(zone==='empress'){
      tableDress(0,-15,4,1.6);for(const sx of [-12,12])tableDress(sx,-6,3.5,1.6);
    }else if(zone==='dowager'){
      tableDress(0,-17,4.5,1.5);for(const sx of [-12,12])tableDress(sx,8,2.8,1.4);
    }else if(zone==='emperor'){
      for(const sx of [-15,15])for(const sz of [-18,2,14])tableDress(sx,sz,3.4,1.3);
    }else{
      tableDress(7,-24.5,2.8,1.25);
      // The Ladies north wing gets the same measured window joinery as the court.
      // Privacy partitions and authored canopy bed are deliberately untouched.
    }
  }
  for(const [m,parts]of buckets){
    const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)continue;
    g.computeBoundingBox();g.computeBoundingSphere();ownedGeometries.push(g);
    const mesh=new THREE.Mesh(g,m);mesh.name=m.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    stats.drawCalls++;stats.triangles+=g.getAttribute('position').count/3;
  }
  root.userData={...root.userData,stats,design:'Original stylized Chinese imperial architecture, measured to existing Harem Empire rooms',units:'metres',zone};
  scene.add(root);return{root,stats,dispose};
}

/** Suggested art direction. Apply explicitly in world.ts; this kit never changes lighting. */
export const PALACE_CRAFT_LIGHTING = {
  hemisphere: {sky:'#fff0d7',ground:'#697879',intensity:1.5},
  sun: {color:'#fff0da',intensity:2.3,position:[-16,24,12]},
  fill: {color:'#d6e4df',intensity:1.0,position:[12,10,-12]},
  lantern: {color:'#ffc888',intensity:10,distance:9,decay:2},
  renderer: {toneMapping:'ACESFilmicToneMapping',exposure:1.0,shadowMap:'PCFSoftShadowMap'},
  note:'Retain generous ambient illumination so anime faces stay readable. Paper-window emissive is subtle, never a substitute for key and fill light.'
} as const;
