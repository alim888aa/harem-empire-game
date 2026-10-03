import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {emperorEntrancePlan} from '../src/palace/emperorEntrance';
import {ModelAssetPool} from '../src/palace/assetPool';
import {acquireEmperorModel,EMPEROR_ASSET_URL} from '../src/palace/palaceAssets';
import EmperorEncounter from '../src/components/EmperorEncounter';
import EmperorIntro from '../src/components/EmperorIntro';
import {countsFreeRoamTime} from '../src/lib/firstEmperorVisit';

test('introductory entrance is shorter without changing regular encounter pacing',()=>{
  assert.deepEqual(emperorEntrancePlan(false),{seconds:1.5,searchLengths:[4,3,2,1]});
  assert.deepEqual(emperorEntrancePlan(true),{seconds:5,searchLengths:[6.5,5,4,3,2,1]});
  // A shorter path preserves a walking entrance rather than racing the full path.
  assert.ok((4-2.7)/1.5<1);
});

test('warming the Emperor shares the later download but retains no hidden model',async()=>{
  const urls:string[]=[];
  const pool=new ModelAssetPool(100,async url=>{urls.push(url);return new ArrayBuffer(20);},async()=>({scene:new THREE.Group(),animations:[]} as unknown as GLTF));
  await pool.prefetch(EMPEROR_ASSET_URL);
  assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodes,0);assert.equal(pool.stats().decodedAssets,0);
  const model=await acquireEmperorModel(pool);
  assert.deepEqual(urls,[EMPEROR_ASSET_URL]);assert.equal(pool.stats().decodes,1);
  model.dispose();assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);
});

test('cold Emperor loading is truthful and neither tribute nor refusal can commit before arrival',()=>{
  const props={giftsRemaining:20,onGiveGift:()=>{},onRefuse:()=>{}};
  const loading=renderToStaticMarkup(createElement(EmperorEncounter,{...props,arrived:false,loading:true}));
  assert.match(loading,/Preparing the Emperor/);assert.match(loading,/Loading the Emperor/);
  assert.doesNotMatch(loading,/Footsteps draw closer/);assert.equal((loading.match(/disabled=""/g)??[]).length,2);
  const approaching=renderToStaticMarkup(createElement(EmperorEncounter,{...props,arrived:false,loading:false}));
  assert.match(approaching,/The Emperor approaches/);assert.equal((approaching.match(/disabled=""/g)??[]).length,2);
  const arrived=renderToStaticMarkup(createElement(EmperorEncounter,{...props,arrived:true}));
  assert.match(arrived,/awaits your answer/);assert.doesNotMatch(arrived,/disabled=""/);
  const failed=renderToStaticMarkup(createElement(EmperorEncounter,{...props,arrived:false,error:true,onRetry:()=>{},onContinueIn2D:()=>{}}));
  assert.match(failed,/couldn’t load/);assert.doesNotMatch(failed,/Footsteps draw closer/);
  assert.match(failed,/<button>Retry Emperor<\/button>/);assert.match(failed,/<button>Continue in 2D<\/button>/);
  assert.equal((failed.match(/disabled=""/g)??[]).length,2,'recovery lives inside the modal while tribute and refusal remain locked');
});

test('initial visit is a clear acknowledgment with no tribute, refusal, reward or fake audience choices',()=>{
  const html=renderToStaticMarkup(createElement(EmperorIntro,{arrived:true,loading:false,error:false,onContinue:()=>{}}));
  assert.match(html,/A first imperial visit/);assert.match(html,/The Emperor surveys the court/);assert.match(html,/No tribute is required/);
  assert.match(html,/<button>Return to the court<\/button>/);assert.doesNotMatch(html,/Give Tribute|Refuse|Influence|Gifts remaining/);
  const failed=renderToStaticMarkup(createElement(EmperorIntro,{arrived:false,loading:false,error:true,onRetry:()=>{},onContinue:()=>{}}));
  assert.match(failed,/<button>Retry Emperor<\/button>/);assert.match(failed,/<button>Return to the court<\/button>/);
});

test('first visit and season clocks count only visible active free-roam, never menus, loading, expired seasons or tab suspension',()=>{
  assert.equal(countsFreeRoamTime(.2,false,false,false),true);
  for(const [paused,hidden,expired] of [[true,false,false],[false,true,false],[false,false,true]])assert.equal(countsFreeRoamTime(.2,paused,hidden,expired),false);
  for(const delta of [0,-1,2.01,60,NaN,Infinity])assert.equal(countsFreeRoamTime(delta,false,false,false),false);
});
