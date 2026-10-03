import test from 'node:test';import assert from 'node:assert/strict';
import {ROMANCE_PROFILES} from '../src/data/romanceProfiles';
import {assertCourtGraph,createCourtGraph,setRomancePair,updateCourtNode} from '../src/lib/courtGraph';
const graph=()=>createCourtGraph([{name:'Maid Ling',formalFaction:'Independent'},{name:'Scholar Qin',formalFaction:'Independent'}],42);
test('accepted romance validation rejects nonmatching mutual source and deferred identities',()=>{
 const g=setRomancePair(graph(),'Maid Ling','Scholar Qin',true,1);assertCourtGraph(g,Object.keys(g.nodes),1);
 const bad=structuredClone(g);bad.edges['Scholar Qin']['Maid Ling'].romance!.source='legacy';assert.throws(()=>assertCourtGraph(bad,Object.keys(bad.nodes),1),/mutual accepted romance/);
 const deferred=setRomancePair(graph(),'Maid Ling','Emperor',true,1);assert.throws(()=>assertCourtGraph(deferred,Object.keys(deferred.nodes),1),/authored adult nonfamily romance/);
});
test('historical accepted romance survives death/expulsion while authored minors and family are rejected',t=>{
 const g=setRomancePair(graph(),'Maid Ling','Scholar Qin',true,1);
 for(const status of ['deceased','expelled'] as const){const historical=updateCourtNode(g,'Maid Ling',{status});assertCourtGraph(historical,Object.keys(historical.nodes),1);}
 const original=ROMANCE_PROFILES['Maid Ling'];t.after(()=>{ROMANCE_PROFILES['Maid Ling']=original;});
 for(const patch of [{adult:false},{familyId:ROMANCE_PROFILES['Scholar Qin'].familyId}]){ROMANCE_PROFILES['Maid Ling']={...original,...patch};assert.throws(()=>assertCourtGraph(g,Object.keys(g.nodes),1),/authored adult nonfamily romance/);}
});
