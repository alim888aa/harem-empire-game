import {placeSpeech} from './speechPlacement';
import {isTouchViewportPlaytest} from '../persistence/playtestMode';
import {emperorEntrancePlan,type EmperorAppearanceStatus} from './emperorEntrance';
import {clearInteractionPath} from './interactionPath';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { createPalaceWorld, type CourtPerson } from './world';
import { loadCourtCharacterModels, playerMovementSpeeds, characterAssetUrls, type CharacterModelStatus } from './characterModels';
import PlaytestConsole, { playtestEnabled } from './PlaytestConsole';
import { applySoftwareMaterials } from './softwareMaterials';
import { loadPalaceAssets, acquireEmperorModel, palaceAssetUrls, EMPEROR_ASSET_URL } from './palaceAssets';
import { palaceAssetPool, type ModelInstanceLease, type ModelLease } from './assetPool';
import { careerZoneAccess, type PalaceZone } from '../lib/careerAccess';
import { createPalaceVisitState, zoneRoster, zoneSpawn, zoneGates, ZONES, PLAYABLE_ZONES, type PalaceVisitState, type PlayableZone } from './zones';
import {requestJump,stepJump,type JumpState} from './jumpPhysics';
import PalaceTouchControls, { useTouchControls } from './PalaceTouchControls';
import { CameraGesture, combineMovement, STOPPED_TOUCH, type TouchVector } from './touchGestures';

const EMPEROR_SCALE=1.1;
const EMPEROR_CLEARANCE=.60*EMPEROR_SCALE;
const EMPEROR_OVERHEAD=2.30*EMPEROR_SCALE;

interface Props {
  people: CourtPerson[];
  rank?: string|null;
  season?: number;
  seasonProgress?: number;
  visitState?: PalaceVisitState;
  onPresenceChange?: (presence:{zone:PalaceZone;names:string[]})=>void;
  playerType: string;
  paused: boolean;
  emperorEncounter: boolean;
  emperorIntro?: boolean;
  giftReaction: { name: string; sequence: number };
  onEmperorArrived: () => void;
  onEmperorStatus: (status:EmperorAppearanceStatus) => void;
  onInteract: (name: string) => void;
  onUnavailable: () => void;
  onAdvanceSeason: () => void;
  onExpireSeason: () => void;
  onRenderReady: (ready:boolean) => void;
  conversationName: string|null;
  conversationReply?:string;
  onSpeechProjectionChange?:(anchored:boolean)=>void;
}

export default function PalaceScene({people,rank=null,season=1,seasonProgress=0,visitState,onPresenceChange,playerType,paused,emperorEncounter,emperorIntro=false,giftReaction,onEmperorArrived,onEmperorStatus,onInteract,onUnavailable,onAdvanceSeason,onExpireSeason,onRenderReady,conversationName,conversationReply='',onSpeechProjectionChange}:Props) {
  const host=useRef<HTMLDivElement>(null);
  const ownVisitState=useRef(createPalaceVisitState(playerType));
  const visits=visitState??ownVisitState.current;
  const [zone,setZone]=useState<PlayableZone>(()=>visits.zone);
  const [nearbyGate,setNearbyGate]=useState<PlayableZone|null>(null);
  const [gateNotice,setGateNotice]=useState('');
  const travel=useRef<(destination?:PlayableZone)=>string>(()=>'Approach a marked gate.');
  const presenceKey=useRef('');
  const updateSeason=useRef<(season:number)=>void>(()=>{});
  const updatePlayerOutfit=useRef<(rank:string|null)=>void>(()=>{});
  useEffect(()=>{
    if(!careerZoneAccess(playerType,rank,zone).allowed){
      const entry=createPalaceVisitState(playerType).zone;
      setGateNotice(`${ZONES[zone].title}: ${careerZoneAccess(playerType,rank,zone).reason} Returning to ${ZONES[entry].title}.`);
      visits.zone=entry;setZone(entry);
    }
  },[rank,playerType,zone,visits]);
  const displayNames=Object.fromEntries(people.map(person=>[person.name,person.displayName??person.name]));
  // Refs bridge React's modal state to the renderer; spatial state stays in Three.js.
  const live=useRef({paused,onInteract,emperorEncounter,emperorIntro,onEmperorArrived,onUnavailable,giftReaction,onAdvanceSeason,onExpireSeason,conversationName,conversationReply,onSpeechProjectionChange,rank,onPresenceChange,displayNames,people,season,seasonProgress});live.current={paused,onInteract,emperorEncounter,emperorIntro,onEmperorArrived,onUnavailable,giftReaction,onAdvanceSeason,onExpireSeason,conversationName,conversationReply,onSpeechProjectionChange,rank,onPresenceChange,displayNames,people,season,seasonProgress};
  const input=useRef(new Set<string>());
  const touchMode=useTouchControls();
  const touchRun=useRef(false);
  const touchMove=useRef<TouchVector>({...STOPPED_TOUCH});
  const resetTouch=useRef<()=>void>(()=>{});
  const resetSceneInput=useRef<()=>void>(()=>{});
  const interact=useRef<()=>void>(()=>{});
  const center=useRef<()=>void>(()=>{});
  const jump=useRef<()=>void>(()=>{});
  const [nearby,setNearby]=useState<string|null>(null);
  const [area,setArea]=useState(ZONES[zone].title);
  const [error,setError]=useState(false);
  const [ready,setReady]=useState(false);
  const [modelStatus,setModelStatus]=useState<CharacterModelStatus>({playerReady:false,pending:0,failures:[]});
  const retryModels=useRef<()=>void>(()=>{});
  const [modelRetry,setModelRetry]=useState(0);
  const playerAssetPin=useRef<ModelLease|null>(null);
  const hasSeenEmperor=useRef(false);
  const [help,setHelp]=useState(false);
  const [testing] = useState(playtestEnabled);
  const [software] = useState(()=>new URLSearchParams(window.location.search).get('renderer')==='software');
  // Pin just the player's decoded template across zone rebuilds. Scene clones
  // keep private skeletons; off-zone NPCs and props still release immediately.
  useEffect(()=>{
    if(software)return;
    const url=characterAssetUrls([],playerType,rank)[0];if(!url)return;
    const abort=new AbortController();
    void palaceAssetPool.acquire(url,abort.signal).then(lease=>{
      if(abort.signal.aborted){lease.release();return;}
      const previous=playerAssetPin.current;playerAssetPin.current=lease;previous?.release();
    }).catch(()=>{});
    return()=>abort.abort();
  },[playerType,rank,software,modelRetry]);
  useEffect(()=>()=>{playerAssetPin.current?.release();playerAssetPin.current=null;},[]);
  const [readout,setReadout] = useState('Waiting for renderer');
  const execute = useRef<(command:string)=>string>(()=>'Renderer unavailable');
  const mapPlayer=useRef<HTMLSpanElement>(null);
  const currentPeople=zoneRoster(people,zone,season,seasonProgress,playerType);
  const suggestedZone=PLAYABLE_ZONES.find(other=>other!==zone&&careerZoneAccess(playerType,rank,other).allowed&&zoneRoster(people,other,season,seasonProgress,playerType).length>0);
  const rosterKey=currentPeople.map(p=>p.name).join('|');
  useEffect(()=>{if(paused)resetSceneInput.current();},[paused]);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let disposed=false,rendererFailed=false;
    setReady(false);setError(false);onRenderReady(false);setNearby(null);setNearbyGate(null);
    setModelStatus({playerReady:false,pending:0,failures:[]});
    const stored=visits.playerByZone[zone]??{...zoneSpawn(zone),yaw:0,pitch:.22,distance:5.7};
    let renderer:THREE.WebGLRenderer|SVGRenderer;
    if(software){renderer=new SVGRenderer();renderer.setQuality('low');renderer.setPrecision(1);renderer.sortObjects=false;}
    else{
      try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{setError(true);onRenderReady(false);if(live.current.emperorEncounter)live.current.onUnavailable();return;}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    }
    renderer.domElement.setAttribute('aria-label',`3D ${ZONES[zone].title}. Use W A S D or arrow keys to move. Drag to look. E talks or enters a nearby gate.`);
    renderer.domElement.setAttribute('role','application');renderer.domElement.tabIndex=0;element.appendChild(renderer.domElement);
    const world=createPalaceWorld(currentPeople,playerType,software,zone,visits.npcByName);
    world.setSeason(season);updateSeason.current=world.setSeason;
    const disposeSoftwareMaterials=software?applySoftwareMaterials(world.scene):()=>{};
    const disposePalaceAssets=software?()=>{}:loadPalaceAssets(world,zone);
    const visualBlocks=[...world.colliders,...world.viewBlockers];
    const clearView=(from:THREE.Vector3,to:THREE.Vector3)=>{
      const delta=to.clone().sub(from);
      return !visualBlocks.some(c=>{
        let lo=0,hi=1;
        for(const axis of ['x','y','z'] as const){
          const min=(axis==='y'?c.minY:axis==='x'?c.x-c.w/2:c.z-c.d/2)-.08,max=(axis==='y'?c.height:axis==='x'?c.x+c.w/2:c.z+c.d/2)+.08;
          const d=delta[axis],o=from[axis];if(Math.abs(d)<.0001){if(o<min||o>max)return false;}else{let a=(min-o)/d,b=(max-o)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}
        }
        return hi>lo&&hi>0&&lo<1;
      });
    };
    // Software QA has empty spatial anchors; ordinary 3D waits for the real player.
    const characterModels=software?{setPlayerRank:(_rank:string|null)=>{},react:(_name:string)=>{},reactPlayer:()=>{},reactingNames:()=>new Set<string>(),isReady:(_name?:string)=>true,retryFailed:()=>{},update:(_dt:number,_paused:boolean)=>{},dispose:()=>{}}:loadCourtCharacterModels(world,playerType,palaceAssetPool,rank,status=>{
      if(disposed||rendererFailed)return;
      setModelStatus(status);setReady(status.playerReady);onRenderReady(status.playerReady);
    });
    retryModels.current=()=>{characterModels.retryFailed();setModelRetry(value=>value+1);};
    updatePlayerOutfit.current=characterModels.setPlayerRank;
    const movementSpeeds=playerMovementSpeeds(playerType);
    if(software){world.scene.traverse(o=>{if(o instanceof THREE.Light)o.intensity*=.22;});world.scene.add(new THREE.AmbientLight('#ffffff',.7));}
    let lastGift=giftReaction.sequence,giftTime=0,giftTarget:typeof world.npcs[number]|undefined;
    const giftGeometry=new THREE.BoxGeometry(.22,.15,.18);
    const giftMaterial=new THREE.MeshStandardMaterial({color:'#e6c78b',metalness:.15,roughness:.5});
    const giftBox=new THREE.Mesh(giftGeometry,giftMaterial);giftBox.castShadow=true;giftBox.visible=false;world.scene.add(giftBox);
    const camera=new THREE.PerspectiveCamera(55,1,.1,130);
    let yaw=stored.yaw,pitch=stored.pitch,distance=stored.distance,last=performance.now(),elapsed=0,frame=0,firstFrame=true,telemetry=0,nearest:string|null=null,nearestGate:PlayableZone|null=null;
    let jumpQueued=false,poseSaveElapsed=0;
    const prefetchedPortals=new Set<string>();
    let scriptedUntil=0,renderedFrames=0,frameTime=0,frameCount=0,fps=0,lastPaint=0;
    const position=world.player.group.position;
    const restored=stored.x>world.bounds.minX+.5&&stored.x<world.bounds.maxX-.5&&stored.z>world.bounds.minZ+.5&&stored.z<world.bounds.maxZ-.5&&
      !world.colliders.some(c=>Math.abs(stored.x-c.x)<c.w/2+.4&&Math.abs(stored.z-c.z)<c.d/2+.4)&&!world.npcs.some(n=>Math.hypot(stored.x-n.x,stored.z-n.z)<.8)?stored:world.spawn;
    position.set(restored.x,restored===stored&&stored.airborne?stored.y??world.groundHeight(restored.x,restored.z):world.groundHeight(restored.x,restored.z),restored.z);
    const offset=new THREE.Vector3(),target=new THREE.Vector3(),projected=new THREE.Vector3();
    const jumpState:JumpState={y:position.y,velocity:restored===stored?stored.velocity??0:0,airborne:restored===stored?stored.airborne??false:false};
    world.player.airborne=jumpState.airborne;world.player.jumpVelocity=jumpState.velocity;
    let emperor:THREE.Object3D|null=null,mixer:THREE.AnimationMixer|null=null,approach:THREE.AnimationAction|null=null,idle:THREE.AnimationAction|null=null,wasEncounter=false,wasIntro=false,approachTime=0,reportedArrival=false,emperorFailed=false;
    let emperorInstance:ModelInstanceLease|null=null,emperorAbort:AbortController|null=null,emperorRequested=false,emperorWarmed=false,emperorLoadFailed=false;
    let entrancePlan=emperorEntrancePlan(!emperorIntro);
    const emperorStart=new THREE.Vector3(),emperorEnd=new THREE.Vector3();let imperialYaw=0;
    const normalLights: {light:THREE.Light;intensity:number}[]=[];world.scene.traverse(o=>{if(o instanceof THREE.Light)normalLights.push({light:o,intensity:o.intensity});});
    const emperorKey=new THREE.SpotLight('#f5debd',50,12,.39,.7,2);emperorKey.castShadow=true;emperorKey.shadow.mapSize.set(2048,2048);emperorKey.shadow.bias=-.0001;emperorKey.shadow.normalBias=.005;emperorKey.visible=false;world.scene.add(emperorKey,emperorKey.target);
    const robeFill=new THREE.SpotLight('#c0d5ec',12,6,.33,.65,2);robeFill.visible=false;world.scene.add(robeFill,robeFill.target);
    const emperorRim=new THREE.SpotLight('#ffd39a',35,10,.5,.75,2);emperorRim.visible=false;world.scene.add(emperorRim,emperorRim.target);
    if(software){emperor=new THREE.Group();emperor.visible=false;world.scene.add(emperor);}
    const requestEmperor=()=>{
      if(software||emperorRequested)return;
      emperorRequested=true;emperorLoadFailed=false;onEmperorStatus({loading:true,retry:null});const abort=new AbortController();emperorAbort=abort;
      acquireEmperorModel(palaceAssetPool,abort.signal).then(instance=>{
        if(disposed||abort.signal.aborted||emperorAbort!==abort){instance.dispose();return;}
        emperorInstance=instance;emperor=instance.root;emperor.scale.setScalar(EMPEROR_SCALE);emperor.visible=false;
        emperor.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
        world.scene.add(emperor);mixer=new THREE.AnimationMixer(emperor);
        const walk=instance.animations.find(a=>/approach|walk/i.test(a.name)),rest=instance.animations.find(a=>/idle/i.test(a.name));
        if(walk)approach=mixer.clipAction(walk);if(rest)idle=mixer.clipAction(rest);
        onEmperorStatus({loading:false,retry:null});
      }).catch(()=>{if(!disposed&&!abort.signal.aborted&&emperorAbort===abort){emperorLoadFailed=true;onEmperorStatus({loading:false,retry:retryEmperorLoad});}});
    };
    const retryEmperorLoad=()=>{if(disposed||!emperorLoadFailed)return;emperorLoadFailed=false;emperorRequested=false;requestEmperor();};
    const labels=world.npcs.map(n=>{const label=document.createElement('div');label.className='palace-person-label';label.textContent=n.displayName??n.name;element.appendChild(label);return label;});
    const speech=document.createElement('div');speech.className='palace-head-speech';speech.setAttribute('aria-hidden','true');speech.style.display='none';element.appendChild(speech);let speechProjected=false;
    const gateLabels=world.gates.map(gate=>{const label=document.createElement('div');label.className='palace-person-label palace-gate-label';label.textContent=gate.label;element.appendChild(label);return label;});
    const resize=()=>{const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    const resetInput=()=>{input.current.clear();touchMove.current={...STOPPED_TOUCH};touchRun.current=false;resetTouch.current();resetCamera();scriptedUntil=0;jumpQueued=false;};
    resetSceneInput.current=resetInput;
    jump.current=()=>{if(!live.current.paused&&!world.player.airborne)jumpQueued=true;};
    const chooseViewYaw=(other:THREE.Vector3,headHeight:number,focusHeight:number,viewDistance:number)=>{
      const base=Math.atan2(position.x-other.x,position.z-other.z),center=new THREE.Vector3((position.x+other.x)*.5,position.y+focusHeight,(position.z+other.z)*.5);
      const head=new THREE.Vector3(other.x,world.groundHeight(other.x,other.z)+headHeight,other.z),playerHead=position.clone().add(new THREE.Vector3(0,1.7,0));
      for(const turn of [1.05,-1.05,1.65,-1.65]){
        const angle=base+turn,point=center.clone().add(new THREE.Vector3(Math.sin(angle)*viewDistance,Math.sin(.22)*viewDistance+.6,Math.cos(angle)*viewDistance));
        if(clearView(point,head)&&clearView(point,playerHead))return angle;
      }
      return base+1.05;
    };
    travel.current=(destination=nearestGate??undefined)=>{
      if(live.current.paused||world.player.airborne)return 'Finish the conversation and land before traveling.';
      const gate=world.gates.find(g=>g.to===destination);
      if(!gate||Math.hypot(position.x-gate.x,position.z-gate.z)>2.8||!clearInteractionPath(position,gate,world.colliders,world.bounds,movementSpeeds.radius))return 'Approach the marked gate through its doorway first.';
      const access=careerZoneAccess(playerType,live.current.rank,gate.to);
      if(!access.allowed){const reason=`${gate.label}: ${access.reason}`;setGateNotice(reason);return reason;}
      resetInput();setGateNotice('');setReady(false);onRenderReady(false);visits.zone=gate.to;setZone(gate.to);
      return `Entering ${gate.label}`;
    };
    const doInteract=()=>{
      if(live.current.paused||world.player.airborne)return;
      if(!nearest){if(nearestGate)travel.current(nearestGate);return;}
      const npc=world.npcs.find(n=>n.name===nearest);
      if(npc){world.player.group.rotation.y=Math.atan2(npc.x-position.x,npc.z-position.z);npc.group.rotation.y=Math.atan2(position.x-npc.x,position.z-npc.z);distance=4.5;pitch=.22;yaw=chooseViewYaw(npc.group.position,npc.labelHeight-.4,.45,distance);}
      resetInput();live.current.onInteract(nearest);
    };interact.current=doInteract;
    center.current=()=>{yaw=0;pitch=.22;distance=5.7;};
    execute.current=(command:string)=>{
      const [verb,arg,value,...extra]=command.trim().toLowerCase().split(/\s+/);
      if(extra.length)return 'Too many arguments';
      if(verb==='stop'){resetInput();scriptedUntil=0;return 'Stopped';}
      if(live.current.paused)return 'Paused: close the conversation or menu first';
      if(verb==='walk'||verb==='run'){
        const key=({forward:'w',back:'s',left:'a',right:'d'} as Record<string,string>)[arg];
        const duration=value===undefined?1:Number(value);
        if(!key||!Number.isFinite(duration)||duration<=0||duration>8)return 'Use walk/run forward/back/left/right, then 0–8 seconds';
        resetInput();input.current.add(key);if(verb==='run')input.current.add('shift');scriptedUntil=performance.now()+duration*1000;
        return `${verb} ${arg} for ${duration}s through normal collision checks`;
      }
      if(verb==='turn'||verb==='look'||verb==='zoom'){
        const amount=Number(arg);if(!arg||!Number.isFinite(amount)||value!==undefined)return 'Supply one finite number';
        if(verb==='turn')yaw+=THREE.MathUtils.degToRad(amount);
        if(verb==='look')pitch=THREE.MathUtils.clamp(THREE.MathUtils.degToRad(amount),.16,.85);
        if(verb==='zoom')distance=THREE.MathUtils.clamp(amount,4.3,10);
        return `${verb} applied`;
      }
      if(arg!==undefined)return 'This command takes no arguments';
      if(verb==='jump'){jump.current();return world.player.airborne?'Already airborne':'Jump requested through normal collision checks';}
      if(verb==='interact'){if(world.player.airborne)return 'Land before interacting';if(nearest){doInteract();return `Speaking with ${nearest}`;}return travel.current();}
      if(verb==='season'){live.current.onAdvanceSeason();return 'Requested normal next-season action';}
      if(verb==='expire'){live.current.onExpireSeason();return 'Timer set to zero; normal expiry handler will run';}
      return 'Unknown command. See examples below.';
    };
    const keydown=(e:KeyboardEvent)=>{
      if(live.current.paused||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;
      if((e.target as HTMLElement)?.closest('input,select,textarea'))return;
      const key=e.key.toLowerCase();
      if(scriptedUntil){resetInput();scriptedUntil=0;}
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e',' '].includes(key))e.preventDefault();
      if(key===' '&&!e.repeat)jump.current();else if(key==='e'&&!e.repeat)doInteract();else input.current.add(key);
      if(key==='r')center.current();
    };
    const keyup=(e:KeyboardEvent)=>input.current.delete(e.key.toLowerCase());
    const cameraGesture=new CameraGesture();
    const canvas=renderer.domElement;
    const resetCamera=()=>{
      const ids=cameraGesture.pointerIds;cameraGesture.reset();
      for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    };
    const acceptsInput=()=>!live.current.paused&&!document.hidden&&!document.querySelector('dialog[open]')&&!rendererFailed&&characterModels.isReady();
    const pointerdown=(event:Event)=>{
      const e=event as PointerEvent;if(!acceptsInput()||(e.pointerType==='mouse'&&e.button!==0))return;
      // Touch camera ownership begins on the right. Left thumb and UI pointers
      // belong to their own elements and never enter this gesture's pointer map.
      const rect=canvas.getBoundingClientRect();
      if(e.pointerType==='touch'&&e.clientX<rect.left+rect.width*.48)return;
      if(!cameraGesture.begin(e.pointerId,{x:e.clientX,y:e.clientY}))return;
      e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    };
    const pointermove=(event:Event)=>{
      const e=event as PointerEvent;if(!acceptsInput()){resetCamera();return;}
      const delta=cameraGesture.move(e.pointerId,{x:e.clientX,y:e.clientY});if(!delta)return;
      e.preventDefault();yaw-=delta.dx*.005;pitch=THREE.MathUtils.clamp(pitch+delta.dy*.003,.16,.85);
      distance=THREE.MathUtils.clamp(distance*Math.exp(delta.zoom),4.3,10);
    };
    const pointerup=(event:Event)=>{
      const e=event as PointerEvent;if(!cameraGesture.end(e.pointerId))return;
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    };
    const wheel=(event:Event)=>{const e=event as WheelEvent;if(!acceptsInput())return;e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.008,4.3,10);};
    const hidden=()=>{if(document.hidden)resetInput();};
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',resetInput);
    window.addEventListener('resize',resetInput);document.addEventListener('visibilitychange',hidden);
    canvas.addEventListener('pointerdown',pointerdown);canvas.addEventListener('pointermove',pointermove);canvas.addEventListener('pointerup',pointerup);canvas.addEventListener('pointercancel',pointerup);canvas.addEventListener('lostpointercapture',pointerup);canvas.addEventListener('wheel',wheel,{passive:false});
    const contextLost=(e:Event)=>{e.preventDefault();rendererFailed=true;setError(true);onRenderReady(false);resetInput();if(live.current.emperorEncounter)live.current.onUnavailable();};canvas.addEventListener('webglcontextlost',contextLost);
    const valid=(x:number,z:number)=>x>world.bounds.minX+.45&&x<world.bounds.maxX-.45&&z>world.bounds.minZ+.45&&z<world.bounds.maxZ-.45&&!world.colliders.some(c=>Math.abs(x-c.x)<c.w/2+movementSpeeds.radius&&Math.abs(z-c.z)<c.d/2+movementSpeeds.radius);
    const canMove=(x:number,z:number)=>valid(x,z)&&!world.npcs.some(n=>{
      const next=Math.hypot(x-n.x,z-n.z),current=Math.hypot(position.x-n.x,position.z-n.z);
      return next<.76&&next<=current;
    });
    const clearLine=(from:THREE.Vector3,to:THREE.Vector3)=>clearInteractionPath(from,to,world.colliders,world.bounds,movementSpeeds.radius);
    const clearImperialPath=(from:THREE.Vector3,to:THREE.Vector3)=>{
      const steps=Math.max(1,Math.ceil(from.distanceTo(to)/.2));
      for(let i=0;i<=steps;i++){
        const t=i/steps,x=THREE.MathUtils.lerp(from.x,to.x,t),z=THREE.MathUtils.lerp(from.z,to.z,t);
        if(x<world.bounds.minX+EMPEROR_CLEARANCE||x>world.bounds.maxX-EMPEROR_CLEARANCE||z<world.bounds.minZ+EMPEROR_CLEARANCE||z>world.bounds.maxZ-EMPEROR_CLEARANCE||Math.hypot(x-position.x,z-position.z)<1.1)return false;
        if(visualBlocks.some(c=>c.minY<world.groundHeight(x,z)+EMPEROR_OVERHEAD&&c.height>world.groundHeight(x,z)&&Math.abs(x-c.x)<c.w/2+EMPEROR_CLEARANCE&&Math.abs(z-c.z)<c.d/2+EMPEROR_CLEARANCE)||world.npcs.some(n=>Math.hypot(x-n.x,z-n.z)<EMPEROR_CLEARANCE+.42))return false;
      }
      return true;
    };
    const animate=(now:number)=>{
      if(!software&&!live.current.paused){
        const gate=world.gates.find(g=>Math.hypot(position.x-g.x,position.z-g.z)<7&&careerZoneAccess(playerType,live.current.rank,g.to).allowed);
        if(gate&&!prefetchedPortals.has(gate.to)){
          prefetchedPortals.add(gate.to);
          const visitors=zoneRoster(live.current.people,gate.to,live.current.season,live.current.seasonProgress,playerType);
          const urls=[...palaceAssetUrls(gate.to),...characterAssetUrls(visitors,playerType,live.current.rank)];
          for(const url of new Set(urls))void palaceAssetPool.prefetch(url).catch(()=>{});
        }
      }
      const rawDelta=(now-last)/1000,dt=document.hidden?0:Math.min(rawDelta,software?.35:.15);last=now;elapsed+=dt;let moving=false;
      const beforeX=position.x,beforeZ=position.z;
      if(scriptedUntil&&(now>=scriptedUntil||live.current.paused||document.hidden)){resetInput();scriptedUntil=0;}
      if(!live.current.paused&&!document.hidden){
        const keys=input.current;
        const {forward,right}=combineMovement({forward:Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),right:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))},touchMove.current);
        moving=Math.hypot(forward,right)>0;
        if(moving){const speed=((keys.has('shift')||touchRun.current)?movementSpeeds.run:movementSpeeds.walk)*dt;const dx=(right*Math.cos(yaw)-forward*Math.sin(yaw))*speed,dz=(-forward*Math.cos(yaw)-right*Math.sin(yaw))*speed;
          // Fixed-size collision steps preserve wall blocking even in a slow software frame.
          const steps=Math.max(1,Math.ceil(dt/.025));for(let step=0;step<steps;step++){
            if(canMove(position.x+dx/steps,position.z))position.x+=dx/steps;
            if(canMove(position.x,position.z+dz/steps))position.z+=dz/steps;
          }
          const wanted=Math.atan2(dx,dz),difference=THREE.MathUtils.euclideanModulo(wanted-world.player.group.rotation.y+Math.PI,Math.PI*2)-Math.PI;world.player.group.rotation.y+=difference*(1-Math.exp(-dt*12));
        }
      }
      world.player.moveSpeed=dt>0?Math.hypot(position.x-beforeX,position.z-beforeZ)/dt:0;
      moving=world.player.moveSpeed>.03;
      const floor=world.groundHeight(position.x,position.z);
      const headClearance=visualBlocks.reduce((ceiling,c)=>{
        if(Math.abs(position.x-c.x)>=c.w/2+movementSpeeds.radius || Math.abs(position.z-c.z)>=c.d/2+movementSpeeds.radius || c.height<=position.y)return ceiling;
        return Math.min(ceiling,Math.max(floor,c.minY-movementSpeeds.height-.04));
      },Infinity);
      jumpState.y=position.y;
      if(jumpQueued&&!live.current.paused)requestJump(jumpState,floor,headClearance);
      jumpQueued=false;
      if(jumpState.airborne)stepJump(jumpState,live.current.paused?0:dt,floor,headClearance);
      else jumpState.y=THREE.MathUtils.damp(jumpState.y,floor,20,dt);
      position.y=jumpState.y;world.player.airborne=jumpState.airborne;world.player.jumpVelocity=jumpState.velocity;
      world.animate(elapsed,dt,moving,live.current.paused,characterModels.reactingNames());
      if(live.current.giftReaction.sequence!==lastGift){lastGift=live.current.giftReaction.sequence;giftTarget=world.npcs.find(person=>person.name===live.current.giftReaction.name);giftTime=0;if(giftTarget){characterModels.react(giftTarget.name);characterModels.reactPlayer();}}
      characterModels.update(dt,live.current.paused);
      if(giftTarget&&giftTime<1.2){giftTime+=dt;const t=Math.min(1,giftTime/1.2);giftBox.visible=true;giftBox.position.set(position.x+(giftTarget.x-position.x)*t,THREE.MathUtils.lerp(position.y,giftTarget.group.position.y,t)+1.1+Math.sin(t*Math.PI)*.35,position.z+(giftTarget.z-position.z)*t);giftBox.rotation.y=elapsed*.6;}else giftBox.visible=false;
      if(live.current.emperorEncounter&&!software)requestEmperor();
      if(!live.current.emperorEncounter&&wasEncounter&&!software){emperorAbort?.abort();emperorInstance?.dispose(mixer??undefined);emperorInstance=null;emperor=null;mixer=null;approach=null;idle=null;emperorRequested=false;emperorLoadFailed=false;onEmperorStatus({loading:false,retry:null});}
      if(live.current.emperorEncounter&&(!wasEncounter||wasIntro!==live.current.emperorIntro)){
        entrancePlan=emperorEntrancePlan(!live.current.emperorIntro);approachTime=0;reportedArrival=false;emperorEnd.copy(position);emperorStart.copy(position);
        let foundApproach=false;
        approachSearch: for(const length of entrancePlan.searchLengths)for(let a=0;a<24;a++){
          const direction=new THREE.Vector3(Math.sin(a*Math.PI/12),0,-Math.cos(a*Math.PI/12));
          const start=position.clone().addScaledVector(direction,length),end=position.clone().addScaledVector(direction,Math.min(2.7,length*.7));
          if(clearLine(position,start)&&clearImperialPath(start,end)){emperorEnd.copy(end);emperorStart.copy(start);foundApproach=true;break approachSearch;}
        }
        if(!foundApproach){console.warn('No clear imperial approach here; continuing the encounter in the classic court.');emperorFailed=true;}
        imperialYaw=chooseViewYaw(emperorEnd,2.2,.65,distance);
      }
      if(live.current.emperorEncounter&&emperorFailed){live.current.onUnavailable();}
      normalLights.forEach(({light,intensity})=>light.intensity=intensity*(live.current.emperorEncounter ? (software?.65:.24) : 1));
      emperorKey.visible=robeFill.visible=emperorRim.visible=live.current.emperorEncounter;
      if(emperor){emperor.visible=live.current.emperorEncounter;
        if(live.current.emperorEncounter){approachTime+=dt;const t=Math.min(approachTime/entrancePlan.seconds,1);emperor.position.lerpVectors(emperorStart,emperorEnd,t);emperor.position.y=world.groundHeight(emperor.position.x,emperor.position.z);emperor.rotation.y=Math.atan2(position.x-emperor.position.x,position.z-emperor.position.z);if(t<1){idle?.stop();approach?.play();}else{approach?.stop();idle?.play();if(!reportedArrival){reportedArrival=true;hasSeenEmperor.current=true;live.current.onEmperorArrived();}}mixer?.update(dt);
          const keyOffset=new THREE.Vector3(-.1,5.5,.4).multiplyScalar(EMPEROR_SCALE).applyAxisAngle(new THREE.Vector3(0,1,0),emperor.rotation.y);
          emperorKey.position.copy(emperor.position).add(keyOffset);emperorKey.target.position.copy(emperor.position).add(new THREE.Vector3(0,1.1*EMPEROR_SCALE,0));
          const fillOffset=new THREE.Vector3(-1.3,1.7,2.5).multiplyScalar(EMPEROR_SCALE).applyAxisAngle(new THREE.Vector3(0,1,0),emperor.rotation.y);robeFill.position.copy(emperor.position).add(fillOffset);robeFill.target.position.copy(emperor.position).add(new THREE.Vector3(0,.85*EMPEROR_SCALE,0));
          const rimOffset=new THREE.Vector3(0,3.2,-2.2).multiplyScalar(EMPEROR_SCALE).applyAxisAngle(new THREE.Vector3(0,1,0),emperor.rotation.y);emperorRim.position.copy(emperor.position).add(rimOffset);emperorRim.target.position.copy(emperor.position).add(new THREE.Vector3(0,1.2*EMPEROR_SCALE,0));
        }
      }wasEncounter=live.current.emperorEncounter;wasIntro=live.current.emperorIntro;
      target.set(position.x,position.y+1.35,position.z);
      const speakingTo=world.npcs.find(n=>n.name===live.current.conversationName);
      if(speakingTo)target.set((position.x+speakingTo.x)*.5,position.y+.45,(position.z+speakingTo.z)*.5);
      if(live.current.emperorEncounter){target.set((position.x+emperorEnd.x)*.5,position.y+.65,(position.z+emperorEnd.z)*.5);yaw=imperialYaw;}
      offset.set(Math.sin(yaw)*distance,Math.sin(pitch)*distance+.6,Math.cos(yaw)*distance);
      // Keep the follow camera inside the courtyard walls and in front of the hall back wall.
      offset.add(target);offset.y=Math.min(offset.y,world.ceilingHeight-.25);
      // Shorten the camera ray against architectural blockers instead of clipping through rooms.
      const delta=offset.clone().sub(target);let safe=1;
      for(const c of visualBlocks){
        let lo=0,hi=1;
        for(const axis of ['x','y','z'] as const){const min=(axis==='y'?c.minY:axis==='x'?c.x-c.w/2:c.z-c.d/2)-.15,max=(axis==='y'?c.height:axis==='x'?c.x+c.w/2:c.z+c.d/2)+.15,d=delta[axis],o=target[axis];
          if(Math.abs(d)<.0001){if(o<min||o>max){lo=2;break;}}else{let a=(min-o)/d,b=(max-o)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}
        }if(lo>0&&lo<hi&&lo<safe)safe=Math.max(.015,lo-.025);
      }
      offset.copy(target).addScaledVector(delta,safe);
      camera.position.lerp(offset,1-Math.exp(-dt*9));camera.lookAt(target);
      world.player.group.visible=camera.position.distanceTo(target)>2.25;
      if(firstFrame){camera.position.copy(offset);firstFrame=false;}
      let closest=2.7;nearest=null;
      let nextSpeechProjected=false;
      world.npcs.forEach((n,i)=>{const displayName=live.current.displayNames[n.name]??n.name;if(labels[i].textContent!==displayName)labels[i].textContent=displayName;const dist=Math.hypot(position.x-n.x,position.z-n.z);if(characterModels.isReady(n.name)&&dist<closest&&clearLine(position,n.group.position)){closest=dist;nearest=n.name;}
        projected.set(n.x,n.group.position.y+n.labelHeight,n.z).project(camera);const visible=characterModels.isReady(n.name)&&dist<13&&clearLine(position,n.group.position)&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1;
        labels[i].style.display=visible&&(!live.current.paused||live.current.conversationName===n.name)?'block':'none';labels[i].style.transform=`translate(-50%,-50%) translate(${(projected.x*.5+.5)*element.clientWidth}px,${(-projected.y*.5+.5)*element.clientHeight}px)`;
        if(live.current.conversationName===n.name&&visible&&!software){
          const reply=live.current.conversationReply.startsWith(`${n.name}:`)?live.current.conversationReply.slice(n.name.length+1).trim():live.current.conversationReply;
          const text=`${displayName}: ${reply}`;if(speech.textContent!==text)speech.textContent=text;speech.style.display='block';
          const hostTop=element.getBoundingClientRect().top,dialog=document.querySelector<HTMLDialogElement>('dialog[open]:has(.palace-conversation)'),header=document.querySelector<HTMLElement>('.court-header');
          const minTop=Math.max(16,(header?.getBoundingClientRect().bottom??96)-hostTop+12),maxBottom=Math.min(element.clientHeight-20,(dialog?.getBoundingClientRect().top??element.clientHeight*.5)-hostTop-24);
          const w=speech.offsetWidth,h=speech.offsetHeight;
          // Project a padded full-character region, not just a single head point.
          const headX=(projected.x*.5+.5)*element.clientWidth,headY=(-projected.y*.5+.5)*element.clientHeight;
          const feet=new THREE.Vector3(n.x,n.group.position.y,n.z).project(camera);
          const feetY=(-feet.y*.5+.5)*element.clientHeight;
          const halfWidth=Math.max(44,Math.abs(feetY-headY)*.38);
          const actor={left:headX-halfWidth,right:headX+halfWidth,top:headY-18,bottom:Math.max(headY,feetY)+12};
          const host=element.getBoundingClientRect();
          const obstacles=Array.from(document.querySelectorAll<HTMLElement>('.intrigue-alert.is-palace')).map(el=>{const r=el.getBoundingClientRect();return {left:r.left-host.left-8,right:r.right-host.left+8,top:r.top-host.top-8,bottom:r.bottom-host.top+8};});
          const placement=placeSpeech({left:16,right:element.clientWidth-16,top:minTop,bottom:maxBottom},actor,w,h,obstacles);
          if(placement){
            nextSpeechProjected=true;
            speech.style.left=`${placement.left+w/2}px`;speech.style.top=`${placement.bottom}px`;
          }
        }
        labels[i].classList.toggle('is-near',dist<2.7);n.ring.visible=characterModels.isReady(n.name)&&dist<2.7;
      });
      nearestGate=null;
      world.gates.forEach((gate,i)=>{
        const dist=Math.hypot(position.x-gate.x,position.z-gate.z);
        if(dist<closest&&dist<2.8&&clearInteractionPath(position,gate,world.colliders,world.bounds,movementSpeeds.radius)){closest=dist;nearestGate=gate.to;nearest=null;}
        projected.set(gate.x,3.1,gate.z).project(camera);
        const label=gateLabels[i],access=careerZoneAccess(playerType,live.current.rank,gate.to);
        label.textContent=access.allowed?gate.label:`${gate.label} · ${access.reason}`;
        label.style.display=dist<16&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&!live.current.paused?'block':'none';
        label.style.transform=`translate(-50%,-50%) translate(${(projected.x*.5+.5)*element.clientWidth}px,${(-projected.y*.5+.5)*element.clientHeight}px)`;
        label.classList.toggle('is-locked',!access.allowed);
      });
      frameTime+=rawDelta;if(frameTime>=1){fps=Math.round(frameCount/frameTime);frameTime=0;frameCount=0;}
      poseSaveElapsed+=dt;if(poseSaveElapsed>=.25){
        visits.playerByZone[zone]={x:position.x,z:position.z,yaw,pitch,distance,y:position.y,velocity:jumpState.velocity,airborne:jumpState.airborne};
        for(const n of world.npcs)visits.npcByName[n.name]={zone,x:n.x,z:n.z,rotationY:n.group.rotation.y};poseSaveElapsed=0;
      }
      if(!nextSpeechProjected)speech.style.display='none';if(nextSpeechProjected!==speechProjected){speechProjected=nextSpeechProjected;live.current.onSpeechProjectionChange?.(speechProjected);}
      telemetry+=dt;if(telemetry>.1){setNearby(nearest);setNearbyGate(nearestGate);setArea(ZONES[zone].title);if(mapPlayer.current){mapPlayer.current.style.left=`${(position.x-world.bounds.minX)/(world.bounds.maxX-world.bounds.minX)*100}%`;mapPlayer.current.style.top=`${(position.z-world.bounds.minZ)/(world.bounds.maxZ-world.bounds.minZ)*100}%`;mapPlayer.current.style.transform=`translate(-50%,-50%) rotate(${Math.PI-world.player.group.rotation.y}rad)`;}if(testing)setReadout(`Zone ${zone} · ${world.npcs.length} spatial courtiers\nPool ${palaceAssetPool.stats().liveLeases} leases · ${palaceAssetPool.stats().decodedAssets} decoded · ${(palaceAssetPool.stats().cachedBytes/1048576).toFixed(1)} MiB warm bytes\nFrame ${renderedFrames} · ${fps} fps\nPlayer x ${position.x.toFixed(2)}, y ${position.y.toFixed(2)}, z ${position.z.toFixed(2)}\nJump ${world.player.airborne?'airborne':'grounded'} · vertical ${world.player.jumpVelocity.toFixed(2)} m/s\nCamera ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}\nYaw ${THREE.MathUtils.radToDeg(yaw).toFixed(1)}° · paused ${live.current.paused}\nNearby: ${nearest||'none'}\n${world.npcs.map(n=>`${n.name}: ${n.x.toFixed(1)}, ${n.z.toFixed(1)} · ${n.activity}`).join('\n')}`);telemetry=0;}
      if(!software||now-lastPaint>1000/12){renderer.render(world.scene,camera);lastPaint=now;renderedFrames++;frameCount++;
        // Start the large first-appearance download after the playable frame,
        // without delaying character readiness or retaining a hidden Emperor rig.
        if(!software&&!emperorWarmed&&!hasSeenEmperor.current&&characterModels.isReady()){
          emperorWarmed=true;void palaceAssetPool.prefetch(EMPEROR_ASSET_URL).catch(()=>{});
        }
      }frame=requestAnimationFrame(animate);
    };
    camera.position.set(0,4.3,23);frame=requestAnimationFrame(animate);if(software){setReady(true);onRenderReady(true);}canvas.focus({preventScroll:true});
    return()=>{disposed=true;retryModels.current=()=>{};onEmperorStatus({loading:false,retry:null});visits.playerByZone[zone]={x:position.x,z:position.z,yaw,pitch,distance,y:position.y,velocity:jumpState.velocity,airborne:jumpState.airborne};for(const n of world.npcs)visits.npcByName[n.name]={zone,x:n.x,z:n.z,rotationY:n.group.rotation.y};cancelAnimationFrame(frame);observer.disconnect();resetInput();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',resetInput);window.removeEventListener('resize',resetInput);document.removeEventListener('visibilitychange',hidden);resetSceneInput.current=()=>{};canvas.removeEventListener('pointerdown',pointerdown);canvas.removeEventListener('pointermove',pointermove);canvas.removeEventListener('pointerup',pointerup);canvas.removeEventListener('pointercancel',pointerup);canvas.removeEventListener('lostpointercapture',pointerup);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('webglcontextlost',contextLost);emperorAbort?.abort();emperorInstance?.dispose(mixer??undefined);mixer?.stopAllAction();if(software&&emperor){emperor.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();});}});}characterModels.dispose();giftGeometry.dispose();giftMaterial.dispose();disposePalaceAssets();disposeSoftwareMaterials();emperorKey.shadow.dispose();emperorRim.shadow.dispose();world.dispose();updateSeason.current=()=>{};updatePlayerOutfit.current=()=>{};if(renderer instanceof THREE.WebGLRenderer){renderer.dispose();renderer.forceContextLoss();}execute.current=()=>'Renderer unavailable';canvas.remove();speech.remove();live.current.onSpeechProjectionChange?.(false);labels.forEach(l=>l.remove());gateLabels.forEach(l=>l.remove());travel.current=()=>"A zone is loading.";};
    // Roster changes are seasonal; gifts and dialog state do not recreate the world.
  },[rosterKey,playerType,zone,visits]);
  useEffect(()=>{updateSeason.current(season);},[season]);
  useEffect(()=>{updatePlayerOutfit.current(rank);},[rank]);
  // A new season invalidates the campaign's spatial presence even when the same
  // cast remains in the same room. Revalidate without rebuilding identical art.
  useEffect(()=>{
    if(!ready)return;
    const key=`${season}:${zone}:${rosterKey}`;
    if(presenceKey.current!==key){presenceKey.current=key;live.current.onPresenceChange?.({zone,names:currentPeople.map(person=>person.name)});}
  },[ready,season,zone,rosterKey]);
  return <>
    <div className={`palace-canvas${touchMode?' is-touch':''}`} ref={host}/>
    <div className="palace-vignette"/>
    {software&&!isTouchViewportPlaytest(window.location.search)&&<div className="palace-software-notice" role="note" aria-label="Software navigation QA. Character visuals require WebGL." title="Software navigation test; character visuals require WebGL">SOFTWARE QA</div>}
    {testing&&<PlaytestConsole execute={execute} readout={readout}/>}
    {!paused&&<>
      <div className="palace-location"><span>{ZONES[zone].subtitle}</span><h1>{area}</h1></div>
      <div className="palace-map" aria-label={`${ZONES[zone].title} floor plan. North is at the top.`}><svg className="map-plan" viewBox={`${ZONES[zone].bounds.minX} ${ZONES[zone].bounds.minZ} ${ZONES[zone].bounds.maxX-ZONES[zone].bounds.minX} ${ZONES[zone].bounds.maxZ-ZONES[zone].bounds.minZ}`} preserveAspectRatio="none" aria-hidden="true"><rect x={ZONES[zone].bounds.minX} y={ZONES[zone].bounds.minZ} width={ZONES[zone].bounds.maxX-ZONES[zone].bounds.minX} height={ZONES[zone].bounds.maxZ-ZONES[zone].bounds.minZ}/>{zoneGates(zone).map(gate=><circle key={gate.id} cx={gate.x} cy={gate.z} r="1" fill={careerZoneAccess(playerType,rank,gate.to).allowed?"#dec990":"#a16b60"}/>)}</svg><span ref={mapPlayer} className="map-player"/><span className="map-north">N</span></div>
      <div className="palace-bottom"><div className="palace-controls"><span><kbd>W A S D</kbd> Move</span><span>Drag to look</span><span><kbd>Shift</kbd> Run</span><span><kbd>Space</kbd> Jump</span><button onClick={()=>{center.current();host.current?.querySelector<HTMLElement>('[role=application]')?.focus();}} title="Reset camera (R)">Recenter</button><button aria-label="Show controls" onClick={()=>setHelp(v=>!v)}>?</button></div></div>
      <div className="palace-interaction" aria-live="polite">{nearby?<button onClick={()=>interact.current()}><kbd>E</kbd><span>Speak with <strong>{displayNames[nearby]??nearby}</strong></span><span>↗</span></button>:nearbyGate?<button onClick={()=>travel.current(nearbyGate)}><kbd>E</kbd><span>Enter <strong>{ZONES[nearbyGate].title}</strong>{!careerZoneAccess(playerType,rank,nearbyGate).allowed&&<small>{careerZoneAccess(playerType,rank,nearbyGate).reason}</small>}</span><span>↗</span></button>:<p>{currentPeople.length?'Approach a courtier or a marked palace gate':suggestedZone?`No courtiers here now. Try ${ZONES[suggestedZone].title}.`:'This wing is quiet. Courtiers may visit later this season.'}</p>}</div>
      {gateNotice&&<div className="palace-gate-notice" role="status">{gateNotice}<button aria-label="Dismiss gate notice" onClick={()=>setGateNotice('')}>×</button></div>}
      {touchMode&&ready&&!error&&<PalaceTouchControls resetRef={resetTouch}
        onMove={vector=>{if(!live.current.paused)touchMove.current=vector;}}
        onSprint={running=>{touchRun.current=!live.current.paused&&running;}}
        onJump={()=>jump.current()} onInteract={()=>interact.current()}
        interaction={nearby?`Speak with ${displayNames[nearby]??nearby}`:nearbyGate?`Enter ${ZONES[nearbyGate].title}`:null}/>}

      {help&&<div className="palace-help" role="status"><strong>Your first move</strong><p>Walk toward a courtier or a marked gate, then press E or tap the action. Each gate checks your career rank. Gifts and careful words earn support. Open Court to see your faction path.</p><p>WASD / arrows · Move<br/>Drag · Look around<br/>Shift · Run · Space · Jump<br/>Scroll · Zoom · R · Recenter<br/>Touch: left thumb joystick · Right-side drag to look<br/>Sprint toggle · Jump · Tap Interact<br/>Two fingers on the right · Pinch to zoom</p><button onClick={()=>setHelp(false)}>Got it</button></div>}
    </>}
    {!ready&&!error&&<div className="palace-loading" role="status"><strong>{modelStatus.failures.includes('@player')?"Your character couldn’t load":"Loading your character…"}</strong><p>Your season clock is paused.</p>{modelStatus.failures.includes('@player')&&<><button onClick={()=>retryModels.current()}>Retry character</button><button onClick={onUnavailable}>Continue in 2D</button></>}</div>}
    {ready&&!error&&modelStatus.failures.length>0&&<div className="palace-model-notice" role="status">Some character art couldn’t load.<button onClick={()=>retryModels.current()}>Retry character art</button></div>}
    {error&&<div className="palace-fallback"><h2>The 3D palace couldn’t render here</h2><p>Your story is still available in the classic court. Your season clock is paused.</p><button onClick={onUnavailable}>Continue in 2D</button><a href="?playtest=1&renderer=software">Open software playtest</a></div>}
  </>;
}
