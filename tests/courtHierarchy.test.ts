import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialCharacters} from '../src/data/characters';
import {COURT_ARCHETYPES,courtArchetype,courtGiftCost} from '../src/lib/courtHierarchy';
import {globalSupportReward} from '../src/lib/campaignBalance';
import {scheduledNpcZone} from '../src/palace/zones';
test('exact48-courtier hierarchy has unique persistent names and the requested per-interaction costs',()=>{
 const people=createInitialCharacters(()=>.5),counts:Record<string,number>={};
 assert.equal(people.length,48);assert.equal(new Set(people.map(p=>p.name)).size,48);
 for(const person of people){const key=courtArchetype(person.name);assert.ok(key,person.name);counts[key]=(counts[key]??0)+1;assert.equal(courtGiftCost(person),COURT_ARCHETYPES[key].giftCost);}
 for(const [key,office]of Object.entries(COURT_ARCHETYPES))assert.equal(counts[key],office.count,key);
 assert.equal(people.reduce((sum,p)=>sum+2*globalSupportReward(p),0),1260);
 assert.ok(globalSupportReward({name:'Concubine Mei'})<globalSupportReward({name:'Scholar Qin'}));
});
test('office cost cannot be spoofed by supplying a cheaper legacy story type',()=>{
 for(const [name,cost]of [['Prime Minister',20],['Empress Dowager',20],['Prince Feng',10],['General Zhao',10],['Consort Hua',10],['Scholar Qin',5],['Concubine Mei',5],['Eunuch Gao',1]] as const)assert.equal(courtGiftCost({name,type:'minor'}),cost);
});
test('new palace staff circulate through all five areas; specialists keep coherent homes',()=>{
 const visits=new Set<string>();for(let season=1;season<=5;season++)for(const p of [0,.26,.51,.76])visits.add(scheduledNpcZone('Eunuch Gao',season,p));
 assert.equal(visits.size,5);assert.equal(scheduledNpcZone('Scholar Qin',1,0),'library');assert.equal(scheduledNpcZone('General Luo',1,0),'emperor');assert.equal(scheduledNpcZone('Consort Yue',1,0),'ladies');
});
