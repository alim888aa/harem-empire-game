import test from 'node:test';import assert from 'node:assert/strict';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import CourtIntriguePanel from '../src/components/CourtIntriguePanel';import {emptyCourtPlots} from '../src/lib/courtPlots';
test('intrigue panel names exact deadline, thresholds, defenses and permanent casualty',()=>{const plots=emptyCourtPlots(3);plots.pending['Prime Minister']={attacker:'Prime Minister',warnedSeason:3,dueSeason:4};plots.events.push({kind:'casualty',season:3,attacker:'Crown Prince',victim:'Maid Ling',reason:'Their frequent contact made this ally a likelier target.'});const html=renderToStaticMarkup(createElement(CourtIntriguePanel,{plots,influence:.6,influences:{'Prime Minister':.8},deceased:{'Maid Ling':{name:'Maid Ling',attacker:'Crown Prince',season:3,reason:'Shield'}}}));for(const text of ['Prime Minister is plotting','start of season 4','80.1%','60.0%','With no allies left, you die','Maid Ling died shielding you','Remember the fallen','80 hate','full season of warning'])assert.ok(html.includes(text),text);});
import {createCourtGraph,PLAYER_NODE} from '../src/lib/courtGraph';
test('warnings do not advertise impossible faction switching and round safe target upward',()=>{const graph=createCourtGraph([{name:'Prime Minister',formalFaction:'Imperial'}],1),plots=emptyCourtPlots(3);plots.pending['Prime Minister']={attacker:'Prime Minister',warnedSeason:3,dueSeason:4};const render=()=>renderToStaticMarkup(createElement(CourtIntriguePanel,{plots,graph,joinableFactions:['Imperial'],influence:.80001,influences:{'Prime Minister':.80002}}));assert.match(render(),/80.1%/);assert.match(render(),/Accepting their faction invitation/);graph.nodes[PLAYER_NODE].faction='Rebel';assert.doesNotMatch(render(),/Accepting their faction invitation/);graph.nodes[PLAYER_NODE].faction=null;graph.nodes['Prime Minister'].faction='Independent';assert.doesNotMatch(render(),/Accepting their faction invitation/);});
import {readFileSync} from 'node:fs';
test('dark intrigue panel explicitly supplies readable foreground colors inside light dialog',()=>{const css=readFileSync('src/style.css','utf8');assert.match(css,/\.court-intrigue\{color:#f3eaf1\}/);assert.match(css,/\.court-intrigue \.court-guide\{color:#d9d0dc\}/);});
import GameOverScreen from '../src/components/GameOverScreen';
test('assassination defeat formats rank title without raw identifiers',()=>{const html=renderToStaticMarkup(createElement(GameOverScreen,{careerEnding:{title:'Assassinated at court',description:'No allies remain.'},gameEndReason:'defeat',finalStats:{supportPoints:0,rank:'grand_prince',season:5},onRestart:()=>{}}));assert.match(html,/Grand Prince/);assert.doesNotMatch(html,/grand_prince/);});
import GameHeader from '../src/components/GameHeader';
test('active plots signal urgency inside Notifications even after their unread badge is cleared', () => {
  const html = renderToStaticMarkup(createElement(GameHeader, {
    gameState: {rank: null, season: 3, systemSupport: 0, gifts: 25},
    onCourtClick: () => {}, onProfileClick: () => {}, onNotificationsClick: () => {},
    unreadNotifications: 0, urgentNotifications: 2,
  }));
  assert.match(html, /Notifications, 2 active assassination warnings/);
  assert.match(html, /has-urgent-notifications/);
  assert.doesNotMatch(html, /notification-badge/);
  assert.doesNotMatch(html, /intrigue-alert/);
});
