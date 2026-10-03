import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';
import {initialCharacters} from '../src/data/characters';import {characterAssetUrls,playerMovementSpeeds} from '../src/palace/characterModels';import {EMPEROR_ASSET_URL} from '../src/palace/palaceAssets';
import {SCOPED_COURT_MODELS,scopedCourtModelSpec} from '../src/palace/scopedCourtRegistry';
function glb(url:string){const file=new URL('../public'+url.split('?')[0],import.meta.url);assert.ok(existsSync(file),url);const b=readFileSync(file);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);const data=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());const hash=createHash('sha256').update(b).digest('hex');assert.ok(hash.startsWith(url.split('v=')[1]),'cache fingerprint matches actual source');return data;}
test('all48 courtiers keep9 authored baselines plus22 exact-name T1/T2 models',()=>{
 const urls=new Set<string>();for(const p of initialCharacters){const list=characterAssetUrls([p],'none');assert.equal(list.length,1,p.name);urls.add(list[0]);}
 assert.equal(urls.size,31);for(const url of urls){const g=glb(url);assert.ok(g.skins?.length>=1);for(const name of ['Idle','Walk','Gift'])assert.ok(g.animations.some((a:any)=>a.name.includes(name)),`${url}/${name}`);if(Object.values(SCOPED_COURT_MODELS).some(s=>s.file===url)){for(const role of ['Face_00','EyeIris','FaceBrow'])assert.ok(g.materials.some((m:any)=>m.name.includes(role)),`${url}/${role}`);const maid=url.includes('anime-maid-');assert.equal(g.skins[0].joints.length,maid?63:59);assert.deepEqual(g.animations.map((a:any)=>a.name),maid?['Idle','Walk','Gift_Present']:['Idle','Walk','Run','Gift_Present']);assert.equal(g.images.length,maid?13:10);}else assert.ok(g.materials.some((m:any)=>/painted.?face/i.test(m.name)||/Painted_Face/.test(m.name)),url);}
});
test('eight scoped Maids use reviewed authored-bob hair and exact per-name cache hashes',()=>{
 assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name=>name.startsWith('Maid ')),['Maid Ling','Maid Su','Maid Bai','Maid Lan','Maid Ting','Maid He','Maid Rou','Maid Zhu']);
 assert.equal(characterAssetUrls([{name:'Maid Ling'}],'none')[0],'/models/scoped-t1/anime-maid-ling-7a1a4b84a21d7d9c.glb?v=7a1a4b84a21d7d9c');
 for(const name of ['Maid Ling ','maid ling','Maid Unknown','__proto__','constructor','toString'])assert.equal(scopedCourtModelSpec(name),undefined,name);
 const expected:Record<string,string>={'Maid Su':'253ed6c3c66621e0','Maid Bai':'6b8736f8ab14ec84','Maid Lan':'ea84dafd8091f167','Maid Ting':'479a7cf9214137ee','Maid He':'bf60ca57c3be5561','Maid Rou':'b44ac0c1de4058fb','Maid Zhu':'5712505462507a37'};
 for(const [name,hash]of Object.entries(expected)){const slug=name.toLowerCase().replace(' ','-');assert.equal(characterAssetUrls([{name}],'none')[0],`/models/scoped-t1/anime-${slug}-${hash}.glb?v=${hash}`);}
 for(const p of initialCharacters.filter(p=>!p.name.startsWith('Maid ')&&!p.name.startsWith('Eunuch ')&&!p.name.startsWith('Scholar ')))assert.ok(!characterAssetUrls([p],'none')[0].includes('/scoped-'),p.name);
});
test('eight reviewed Eunuchs preserve exact identity,59-joint four-clip files and unshifted source clocks',()=>{
 const expected:Record<string,string>={"Eunuch Gao":"1a0555dbadc0e641","Eunuch Lu":"d2b19c803dedeff7","Eunuch Ren":"d86a54d032e01b4e","Eunuch Min":"70c925fc48755f16","Eunuch Jin":"c5cf29aefded55f8","Eunuch Bo":"7171b2e69d00b3c6","Eunuch Tian":"644698cf7bf370a4","Eunuch Shu":"2f92f332a84a0451"};
 assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name=>name.startsWith('Eunuch ')),Object.keys(expected));
 for(const [name,hash]of Object.entries(expected)){const slug=name.toLowerCase().replace(' ','-');const spec=scopedCourtModelSpec(name)!;assert.equal(spec.file,`/models/scoped-t1/anime-${slug}-${hash}.glb?v=${hash}`);assert.equal(spec.walkSpeed,1.2);assert.equal(spec.labelHeight,2.1);assert.equal(spec.normalizeClipOrigin??false,false);}
 for(const name of ['Eunuch Gao ','eunuch gao','Eunuch Unknown'])assert.equal(scopedCourtModelSpec(name),undefined);
});
test('six reviewed Scholars use own59 source identities and distinct simple T2 garment assets',()=>{
 const expected:Record<string,string>={"Scholar Qin":"896b2904971db1f1","Scholar Tao":"19c77473dfaf8c5b","Scholar Jia":"459bdbf0147869fe","Scholar Ren":"b0bc3ca415d3a3c7","Scholar Song":"4085dffc4b8b5e86","Scholar Yu":"d40b8024eed5f1f1"};
 assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name=>name.startsWith('Scholar ')),Object.keys(expected));
 for(const [name,hash]of Object.entries(expected)){const slug=name.toLowerCase().replace(' ','-');const spec=scopedCourtModelSpec(name)!;assert.equal(spec.file,`/models/scoped-t2/anime-${slug}-${hash}.glb?v=${hash}`);assert.equal(spec.walkSpeed,1.2);assert.equal(spec.labelHeight,2.1);assert.equal(spec.normalizeClipOrigin??false,false);}
 for(const name of ['Scholar Qin ','scholar qin','Scholar Unknown'])assert.equal(scopedCourtModelSpec(name),undefined);
});
test('all9 player rank outfits have all7 articulated clips and consistent controller speeds',()=>{
 const urls=new Set<string>();for(const [role,ranks]of [['prince',[null,'grand_prince','crown_prince']],['minister',[null,'minister','prime_minister']],['concubine',[null,'consort','empress']]]as const){assert.equal(playerMovementSpeeds(role).walk,1.35);assert.equal(playerMovementSpeeds(role).run,3.8);for(const rank of ranks){const list=characterAssetUrls([],role,rank);assert.equal(list.length,1);urls.add(list[0]);const g=glb(list[0]);for(const name of ['Idle','Walk','Run','Gift_Present','Jump_Start','Jump_Air','Land'])assert.ok(g.animations.some((a:any)=>a.name===name));assert.ok(g.skins?.length);}}
 assert.equal(urls.size,9);assert.equal(characterAssetUrls([],'concubine','empress_consort')[0],characterAssetUrls([],'concubine','empress')[0]);
});
test('Emperor keeps its dedicated encounter contract and is not an ordinary courtier registry entry',()=>{const g=glb(EMPEROR_ASSET_URL);assert.deepEqual(g.animations.map((a:any)=>a.name),['Imperial_Idle','Imperial_Approach']);assert.equal(characterAssetUrls([{name:'Emperor'}],'none').length,0);});
