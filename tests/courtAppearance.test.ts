import test from 'node:test';import assert from 'node:assert/strict';
import {createInitialCharacters} from '../src/data/characters';
import {courtAppearance} from '../src/palace/courtAppearance';
test('48 identities resolve to eight shared archetype keys and four unique senior offices',()=>{
 const specs=createInitialCharacters(()=>.5).map(x=>courtAppearance(x.name));assert.equal(new Set(specs.filter(s=>!s.unique).map(s=>s.assetKey)).size,8);assert.equal(new Set(specs.filter(s=>s.unique).map(s=>s.assetKey)).size,4);assert.equal(courtAppearance('Empress Consort').primary,'#a71f28');
 for(const names of [['Prince Feng','Prince Han','Prince Jun','Prince Lei'],['General Zhao','General Shen','General Wei','General Luo'],['Consort Hua','Consort Zhen','Consort Rong','Consort Yue'],['Minister Chen','Minister Wang','Minister Liu','Minister Zhang']]){assert.equal(new Set(names.map(n=>courtAppearance(n).primary)).size,4);assert.equal(new Set(names.map(n=>courtAppearance(n).hair)).size,4);assert.equal(new Set(names.map(n=>courtAppearance(n).assetKey)).size,1);}
});
