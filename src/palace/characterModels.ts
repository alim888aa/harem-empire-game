import {courtAppearance} from './courtAppearance';
import {scopedCourtModelSpec} from './scopedCourtRegistry';
import type {CourtArchetype} from '../lib/courtHierarchy';
import * as THREE from 'three';
import { acquireModelInstance, palaceAssetPool, type ModelAssetPool, type ModelInstanceLease } from './assetPool';
import type { PalaceWorld } from './world';

interface ModelSpec {
  file: string;
  labelHeight: number;
  walkSpeed: number;
  runSpeed?: number;
  controlWalk?: number;
  controlRun?: number;
  bodyRadius?: number;
  height?: number;
  normalizeClipOrigin?: boolean;
  palette?: Readonly<Record<string,string>>;
}

// Register a portrait only after its actual exported model and animation are inspected.
// A shared portrait may share geometry/textures, but each actor gets its own skeleton.
const FENG:ModelSpec={file:'/models/prince-runtime.glb?v=b4820284c7ec319b',labelHeight:2.08,walkSpeed:1.2,runSpeed:3.8,controlWalk:1.35,bodyRadius:.36,height:1.90};
const COURT_MODELS: Record<string, ModelSpec | undefined> = {
  'Prince Feng': FENG,
  'Crown Prince':{file:'/models/npc-crown-prince.glb?v=271879e284d1b63a',labelHeight:2.12,walkSpeed:1.2},
  'Prime Minister':{file:'/models/npc-prime-minister.glb?v=cb40e363512af983',labelHeight:2.12,walkSpeed:1.2},
  'Empress Consort':{file:'/models/npc-empress-consort.glb?v=e20a5959b8486135',labelHeight:2.24,walkSpeed:1.2},
  'Empress Dowager':{file:'/models/npc-empress-dowager.glb?v=498361aa702b155b',labelHeight:2.04,walkSpeed:1.2},
  'Maid Ling': { file: '/models/maid-ling-runtime.glb?v=mpfb-1d413f8e', labelHeight: 2.02, walkSpeed: .65 },
};
// Shared bases are registered only after an actual imported GLB proof is checked.
const ARCHETYPE_MODELS:Partial<Record<CourtArchetype,ModelSpec>>={
  prince:FENG,
  concubine:{file:'/models/npc-concubine.glb?v=08e209f5fc697897',labelHeight:2.1,walkSpeed:.902234637,normalizeClipOrigin:true},
  consort:{file:'/models/npc-consort.glb?v=784cc5044edea09d',labelHeight:2.1,walkSpeed:.902234637,normalizeClipOrigin:true},
  minister:{file:'/models/npc-minister.glb?v=3692082fd0431b85',labelHeight:2.1,walkSpeed:1.2},
  general:{file:'/models/npc-general.glb?v=00574e2e4cf503bd',labelHeight:2.1,walkSpeed:1.2},
  maid:{file:'/models/npc-maid.glb?v=ccc7c17cf5476b23',labelHeight:2.02,walkSpeed:.902234637,normalizeClipOrigin:true},
  scholar:{file:'/models/npc-scholar.glb?v=efcc09cb4cd9f82b',labelHeight:2.1,walkSpeed:1.2},
  eunuch:{file:'/models/npc-eunuch.glb?v=2eedf1497addb623',labelHeight:2.1,walkSpeed:1.2},
};
function courtModelSpec(name:string):ModelSpec|undefined {
 const scoped=scopedCourtModelSpec(name);
 if(scoped)return scoped;
 const appearance=courtAppearance(name),base=appearance.archetype?ARCHETYPE_MODELS[appearance.archetype]:undefined;
 if(!base)return COURT_MODELS[name];
 return{...base,palette:{Robe_Primary:appearance.primary,Robe_Secondary:appearance.secondary,Armor_Primary:appearance.primary,Armor_Edge:appearance.secondary,Hair:appearance.hair}};
}
export const PLAYER_PRINCE_ASSET_URL='/models/player-prince-anime.glb?v=3d57abbf33a47f57';
const ANIME_PLAYER:ModelSpec={file:PLAYER_PRINCE_ASSET_URL,labelHeight:1.85,walkSpeed:1.20,runSpeed:3.80,controlWalk:1.35,bodyRadius:.36,height:2.0,normalizeClipOrigin:true};
export const PLAYER_SCHOLAR_OUTFIT_URLS={scholar:'/models/player-scholar.glb?v=b0ac55b0e090a482',minister:'/models/player-minister.glb?v=e7fd3b31bbe42684',prime_minister:'/models/player-prime-minister.glb?v=f3f2c3cdd7de9d8a'} as const;
const SCHOLAR_PLAYER:ModelSpec={file:PLAYER_SCHOLAR_OUTFIT_URLS.scholar,labelHeight:2.10,walkSpeed:1.278,runSpeed:4.047,controlWalk:1.35,controlRun:3.8,bodyRadius:.36,height:2.05,normalizeClipOrigin:true};
export const PLAYER_CONCUBINE_OUTFIT_URLS={concubine:'/models/player-concubine.glb?v=d8cbf6330102ee0b',consort:'/models/player-consort.glb?v=9bb666fbd5877dcd',empress:'/models/player-empress.glb?v=7a44b977ddea0e03'} as const;
const CONCUBINE_PLAYER:ModelSpec={file:PLAYER_CONCUBINE_OUTFIT_URLS.concubine,labelHeight:2.16,walkSpeed:1.340782123,runSpeed:4.245810056,controlWalk:1.35,controlRun:3.8,bodyRadius:.36,height:2.05,normalizeClipOrigin:true};
const PLAYER_MODELS: Record<string, ModelSpec | undefined> = {prince:ANIME_PLAYER,minister:SCHOLAR_PLAYER,scholar:SCHOLAR_PLAYER,concubine:CONCUBINE_PLAYER};
// Register a rank file here only after its exported proof and hash are inspected.
export const PLAYER_PRINCE_OUTFIT_URLS={grand_prince:'/models/player-grand-prince-anime.glb?v=7913e120f746e756',crown_prince:'/models/player-crown-prince-anime.glb?v=14f4cc9c979e8781'} as const;
const PLAYER_PRINCE_OUTFITS:Record<string,ModelSpec|undefined>={
  grand_prince:{...ANIME_PLAYER,file:PLAYER_PRINCE_OUTFIT_URLS.grand_prince},
  crown_prince:{...ANIME_PLAYER,file:PLAYER_PRINCE_OUTFIT_URLS.crown_prince,labelHeight:2.0},
};
const playerSpec=(playerType:string,rank:string|null=null):ModelSpec|undefined=>{
 if(playerType==='prince')return PLAYER_PRINCE_OUTFITS[rank??'']??ANIME_PLAYER;
 if(playerType==='minister'||playerType==='scholar')return {...SCHOLAR_PLAYER,file:rank==='prime_minister'?PLAYER_SCHOLAR_OUTFIT_URLS.prime_minister:rank==='minister'?PLAYER_SCHOLAR_OUTFIT_URLS.minister:PLAYER_SCHOLAR_OUTFIT_URLS.scholar};
 if(playerType==='concubine')return {...CONCUBINE_PLAYER,file:rank==='empress'||rank==='empress_consort'?PLAYER_CONCUBINE_OUTFIT_URLS.empress:rank==='consort'?PLAYER_CONCUBINE_OUTFIT_URLS.consort:PLAYER_CONCUBINE_OUTFIT_URLS.concubine};
 return PLAYER_MODELS[playerType];
};
const PLAYER_KEY = '@player';

/** URLs for just this zone's actors. Prefetch these as bytes, never decoded models. */
export function characterAssetUrls(people: readonly { name: string }[], playerType: string, rank:string|null=null): string[] {
  const specs = [...people.map(person => courtModelSpec(person.name)), playerSpec(playerType,rank)];
  return [...new Set(specs.flatMap(spec => spec ? [spec.file] : []))];
}

export function playerMovementSpeeds(playerType: string) {
  const spec = PLAYER_MODELS[playerType];
  return { walk: spec?.controlWalk ?? 1.35, run: spec?.controlRun ?? spec?.runSpeed ?? 3.8, radius:spec?.bodyRadius ?? .32, height:spec?.height ?? 1.95 };
}

type AnimatedPerson = {
  instance: ModelInstanceLease;
  mixer: THREE.AnimationMixer;
  idle?: THREE.AnimationAction;
  walk?: THREE.AnimationAction;
  run?: THREE.AnimationAction;
  jumpStart?: THREE.AnimationAction;
  jumpAir?: THREE.AnimationAction;
  land?: THREE.AnimationAction;
  jumpPhase: 'grounded' | 'start' | 'air' | 'land';
  jumpRemaining: number;
  wasAirborne: boolean;
  pendingReaction: boolean;
  gift?: THREE.AnimationAction;
  active?: THREE.AnimationAction;
  reactionRemaining: number;
  spec: ModelSpec;
  speed: () => number;
  airborne: () => boolean;
};

export type CharacterModelStatus={playerReady:boolean;pending:number;failures:string[]};
export function loadCourtCharacterModels(world: PalaceWorld, playerType: string, pool: ModelAssetPool = palaceAssetPool, initialRank:string|null=null,onStateChange?:(status:CharacterModelStatus)=>void) {
  let disposed = false;
  const pending=new Map<string,{file:string;abort:AbortController}>();
  const models = new Map<string, AnimatedPerson>();
  const failed=new Set<string>();
  const desired=new Map<string,ModelSpec|undefined>();
  const status=():CharacterModelStatus=>({playerReady:models.has(PLAYER_KEY),pending:pending.size,failures:[...failed]});
  const notify=()=>{if(!disposed)onStateChange?.(status());};
  const targets = world.npcs.map(courtier => ({
    key: courtier.name, group: courtier.group, spec: courtModelSpec(courtier.name),
    speed: () => courtier.moveSpeed,
    onLoaded: (spec: ModelSpec) => {
      courtier.labelHeight = spec.labelHeight;
      if (courtier.activity === 'Reading a scroll') courtier.activity = 'Waiting for an audience';
    },
  }));
  targets.push({ key: PLAYER_KEY, group: world.player.group, spec: playerSpec(playerType,initialRank), speed: () => world.player.moveSpeed, onLoaded: () => {} });
  const loadTarget=(target:typeof targets[number],spec:ModelSpec|undefined)=>{
    if(disposed)return;
    desired.set(target.key,spec);
    if(!spec){failed.add(target.key);notify();return;}
    const previousRequest=pending.get(target.key);
    if(previousRequest?.file===spec.file)return;
    previousRequest?.abort.abort();pending.delete(target.key);
    failed.delete(target.key);
    if(models.get(target.key)?.spec.file===spec.file){notify();return;}
    const request={file:spec.file,abort:new AbortController()};pending.set(target.key,request);notify();
    acquireModelInstance(spec.file,pool,request.abort.signal).then(instance=>{
      if(disposed||pending.get(target.key)!==request){instance.dispose();return;}
      const root = instance.root;
      const mixer = new THREE.AnimationMixer(root);
      try {
        if(spec.palette)instance.applyPalette(spec.palette);
        root.traverse(object => {
          if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
        });
        const clip = (pattern: RegExp) => {
          const found = instance.animations.find(animation => pattern.test(animation.name));
          if(!found)return undefined;
          if(!spec.normalizeClipOrigin)return mixer.clipAction(found);
          // The authored GLB starts at Blender frame1 (.033333s). Shift private
          // clip copies, never shared template data or the physical actor root.
          const copy=found.clone();
          const start=Math.min(...copy.tracks.map(track=>track.times[0]??0));
          if(start>0)copy.tracks.forEach(track=>track.shift(-start));
          copy.resetDuration();return mixer.clipAction(copy);
        };
        const model: AnimatedPerson = { instance, mixer, spec, speed: target.speed, airborne:()=>target.key===PLAYER_KEY&&world.player.airborne, idle: clip(/idle/i), walk: clip(/walk/i), run: clip(/run/i), gift: clip(/gift|react|present/i), reactionRemaining: 0, jumpPhase:'grounded',jumpRemaining:0,wasAirborne:false,pendingReaction:false };
        if(target.key===PLAYER_KEY){
          model.jumpStart=clip(/^Jump_Start$/i);model.jumpAir=clip(/^Jump_Air$/i);model.land=clip(/^Land$/i);
          if(!model.jumpAir)model.jumpAir=clip(/^jump$|^air$/i);
          if(!model.jumpAir&&model.walk){
            const pose=THREE.AnimationUtils.subclip(model.walk.getClip(),'InAirPose',7,8,30);
            model.jumpAir=mixer.clipAction(pose);
          }
          for(const action of [model.jumpStart,model.land])if(action){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
          model.jumpAir?.setLoop(THREE.LoopRepeat,Infinity);
          // An asset that finishes downloading mid-flight must not replay takeoff.
          if(model.airborne()){model.wasAirborne=true;model.jumpPhase='air';}
        }
        if (model.gift) { model.gift.setLoop(THREE.LoopOnce, 1); model.gift.clampWhenFinished = true; }
        const previous=models.get(target.key);
        if(previous){
          model.jumpPhase=previous.jumpPhase;model.jumpRemaining=previous.jumpRemaining;model.wasAirborne=previous.wasAirborne;
          model.reactionRemaining=Math.min(previous.reactionRemaining,model.gift?.getClip().duration??0);model.pendingReaction=previous.pendingReaction;
          const activeName=previous.active?.getClip().name;
          model.active=[model.idle,model.walk,model.run,model.jumpStart,model.jumpAir,model.land,model.gift].find(action=>action?.getClip().name===activeName);
        }
        model.active??=model.wasAirborne?(model.jumpAir??model.idle):model.idle;
        model.active?.play();
        if(model.active&&previous?.active)model.active.time=Math.min(previous.active.time,model.active.getClip().duration);
        model.mixer.update(0);
        // The old art remains until replacement succeeds. Never rebuild the
        // spatial parent, NPC identities, camera or campaign to change clothing.
        for(const child of target.group.children)child.visible=false;
        target.group.scale.setScalar(1);target.group.add(root);target.onLoaded(spec);
        previous?.instance.dispose(previous.mixer);
        models.set(target.key,model);pending.delete(target.key);failed.delete(target.key);notify();
      } catch (error) {
        instance.dispose(mixer);
        throw error;
      }
    }).catch(()=>{
      if(disposed||pending.get(target.key)!==request)return;
      pending.delete(target.key);failed.add(target.key);notify();
      // Keep an existing authored outfit; an initial failure stays body-free.
    });
  };
  for(const target of targets)loadTarget(target,target.spec);
  const playerTarget=targets.find(target=>target.key===PLAYER_KEY)!;
  const change = (model: AnimatedPerson, action: THREE.AnimationAction | undefined, fade=.12) => {
    if (!action || model.active === action) return;
    model.active?.fadeOut(fade);action.reset().setEffectiveWeight(1).fadeIn(fade).play();model.active=action;
  };
  const playGift=(model:AnimatedPerson)=>{
    if(!model.gift)return;
    model.active?.fadeOut(.1);model.gift.reset().setEffectiveWeight(1).fadeIn(.1).play();
    model.active=model.gift;model.reactionRemaining=model.gift.getClip().duration;model.pendingReaction=false;
  };
  const react=(name:string)=>{
    const model=models.get(name);if(!model?.gift)return;
    if(model.airborne()||model.jumpPhase!=='grounded'){model.pendingReaction=true;return;}
    playGift(model);
  };
  return {
    status,
    isReady(name=PLAYER_KEY){return models.has(name);},
    retryFailed(){for(const target of targets)if(failed.has(target.key))loadTarget(target,desired.get(target.key));},
    /** Unknown/uninspected outfits fall back to the registered base player art. */
    setPlayerRank(rank:string|null){loadTarget(playerTarget,playerSpec(playerType,rank));},
    react,
    reactPlayer() { react(PLAYER_KEY); },
    reactingNames() { return new Set([...models.entries()].filter(([name, model]) => name !== PLAYER_KEY && model.reactionRemaining > 0).map(([name]) => name)); },
    update(delta: number, paused: boolean) {
      const dt=Number.isFinite(delta)?Math.max(0,delta):0;
      for(const model of models.values()){
        const speed=model.speed(),airborne=model.airborne();
        model.walk?.setEffectiveTimeScale(THREE.MathUtils.clamp(speed/model.spec.walkSpeed,.1,1.6));
        if(model.spec.runSpeed)model.run?.setEffectiveTimeScale(THREE.MathUtils.clamp(speed/model.spec.runSpeed,.1,1.6));
        if(airborne&&!model.wasAirborne&&!paused){
          // Physical takeoff wins over an older gift reaction; no root translation
          // is extracted from animation. The movement controller owns trajectory.
          model.reactionRemaining=0;
          model.jumpPhase=model.jumpStart?'start':'air';model.jumpRemaining=model.jumpStart?.getClip().duration??0;
          change(model,model.jumpStart??model.jumpAir??model.idle,.04);
        }else if(!airborne&&model.wasAirborne){
          model.jumpPhase=model.land?'land':'grounded';model.jumpRemaining=model.land?.getClip().duration??0;
          if(model.land)change(model,model.land,.04);
        }
        // A planted recovery is only appropriate at rest. Keep controller-driven
        // movement immediately responsive and blend into its measured gait.
        if(model.jumpPhase==='land'&&!paused&&speed>.03){
          model.jumpPhase='grounded';model.jumpRemaining=0;
          const running=model.run&&model.spec.runSpeed&&speed>(model.spec.walkSpeed+model.spec.runSpeed)/2;
          change(model,running?model.run:model.walk??model.idle,.06);
        }
        if(!paused||!airborne)model.wasAirborne=airborne;
        // Menus freeze locomotion/jump phase clocks. An accepted gift remains
        // visible during its dialogue; a grounded landing may finish into it.
        if(paused&&model.reactionRemaining<=0&&!(model.pendingReaction&&!airborne&&(model.jumpPhase==='land'||model.jumpPhase==='grounded')))continue;
        let remaining=dt;
        for(let steps=0;remaining>0&&steps<8;steps++){
          if(model.jumpPhase==='start'||model.jumpPhase==='land'){
            const phase=model.jumpPhase,action=phase==='start'?model.jumpStart:model.land;
            change(model,action,.04);
            const step=Math.min(remaining,Math.max(0,model.jumpRemaining));model.mixer.update(step);remaining-=step;model.jumpRemaining-=step;
            if(model.jumpRemaining<=1e-7){model.jumpPhase=phase==='start'&&airborne?'air':'grounded';}
            else break;
          }else if(model.jumpPhase==='air'){
            change(model,model.jumpAir??model.idle,.04);model.mixer.update(remaining);remaining=0;
          }else{
            if(model.pendingReaction)playGift(model);
            if(model.reactionRemaining>0){
              const step=Math.min(remaining,model.reactionRemaining);model.mixer.update(step);remaining-=step;model.reactionRemaining-=step;
              if(model.reactionRemaining<=1e-7){model.reactionRemaining=0;if(paused){change(model,model.idle,0);model.mixer.update(0);}}
            }else{
              const running=model.run&&model.spec.runSpeed&&speed>(model.spec.walkSpeed+model.spec.runSpeed)/2;
              change(model,!paused&&speed>.03?(running?model.run:model.walk):model.idle);
              model.mixer.update(remaining);remaining=0;
            }
          }
        }
      }
    },
    /** Read-only diagnostics for lifecycle/animation tests; never mutates play state. */
    animationState(name=PLAYER_KEY){
      const model=models.get(name);return model?{assetUrl:model.spec.file,phase:model.jumpPhase,clip:model.active?.getClip().name,remaining:model.jumpRemaining,reactionRemaining:model.reactionRemaining,pendingReaction:model.pendingReaction}:null;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending.forEach(request=>request.abort.abort());pending.clear();
      for (const model of models.values()) model.instance.dispose(model.mixer);
      models.clear();
    },
  };
}
