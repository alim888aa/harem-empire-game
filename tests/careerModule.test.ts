// Characterizes Career through its public API against captured pre-refactor v7 behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as career from '../src/lib/career';
import * as accessContract from '../src/lib/careerAccess';
import * as deadlineContract from '../src/lib/careerDeadline';
import * as noticeContract from '../src/lib/demotionNotice';
import * as balanceContract from '../src/lib/campaignBalance';
import * as standingContract from '../src/lib/campaignStanding';
import * as identityContract from '../src/lib/courtIdentity';
import * as intrigueContract from '../src/lib/courtIntrigue';

const roles = [null, 'unknown', 'prince', 'scholar', 'minister', 'concubine'];
const ranks = [
  null, 'unknown', 'prince', 'grand_prince', 'crown_prince', 'scholar', 'minister',
  'prime_minister', 'concubine', 'consort', 'empress', 'empress_consort'
];
const zones: career.PalaceZone[] = ['common', 'emperor', 'empress', 'ladies', 'dowager', 'library'];

function characterize(role: string | null, rank: string | null) {
  const notice = career.createDemotionNotice(role, rank, 9, 'deadline');
  const next = career.promotionRequirement(role, rank);
  return {
    role, rank, career: career.resolveCareer(role), title: career.startingCareerTitle(role), entry: career.careerEntryZone(role),
    access: zones.map(zone => ({ zone, result: career.careerZoneAccess(role, rank, zone) })),
    rankIndex: career.rankIndex(role, rank), tribute: career.tributeCost(role, rank), grant: career.seasonalGiftGrant(role, rank),
    promotionHate: career.promotionHate(role), next, demoted: career.demotedRank(role, rank),
    standing: career.standingAfterDemotion(role, rank),
    deadlines: [0, 1, 12, 16, 20, 99].map(season => career.promotionDeadline(role, rank, 1, season)),
    notice, reason: notice ? career.demotionReason(notice) : null,
    audienceNotice: career.createDemotionNotice(role, rank, 9, 'audience'),
    consolidation: [false, true].map(waived => [0, 1, 3, 99].map(season =>
      career.consolidationProgress(role, rank, 1, season, waived))),
    displaced: career.displacedOfficeForRank(rank), senior: career.careerSeniorRival(role),
    eligibility: next ? [-1, 0, 1].flatMap(supportDelta => [-1e-8, 0, 1e-8].map(influenceDelta => ({
      supportDelta, influenceDelta,
      allowed: career.mayPromote({
        role, rank, support: next.globalSupport + supportDelta, influence: next.influence + influenceDelta,
        season: 5, eligibleAfterSeason: 5
      }),
      onProbation: career.mayPromote({
        role, rank, support: next.globalSupport + supportDelta, influence: next.influence + influenceDelta,
        season: 5, eligibleAfterSeason: 6
      })
    }))) : []
  };
}

test('all role/rank/access/deadline/finance/office decisions match pre-refactor public outputs', () => {
  const expected = JSON.parse(readFileSync(new URL('./fixtures/career-rules-v7.json', import.meta.url), 'utf8'));
  const actual = roles.flatMap(role => ranks.map(rank => characterize(role, rank)));
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
});

test('stable import contracts re-export identical operations instead of another implementation', () => {
  const contracts: Record<string, unknown>[] = [
    accessContract, deadlineContract, noticeContract, standingContract, identityContract, intrigueContract
  ];
  const operationNames = new Set(Object.keys(career));
  const entrypoint: Record<string, unknown> = career;
  for (const contract of contracts) {
    for (const [name, value] of Object.entries(contract)) {
      if (operationNames.has(name)) assert.equal(value, entrypoint[name], name);
    }
  }
  for (const name of [
    'rankIndex', 'tributeCost', 'seasonalGiftGrant', 'promotionHate', 'promotionRequirement',
    'mayPromote', 'demotedRank', 'consolidationProgress'
  ]) {
    const balance: Record<string, unknown> = balanceContract;
    assert.equal(balance[name], entrypoint[name], name);
  }
  assert.equal(balanceContract.CAMPAIGN_BALANCE.roles, career.CAREER_RULES.roles);
  assert.equal(balanceContract.CAMPAIGN_BALANCE.seasonalGiftsByRank, career.CAREER_RULES.seasonalGiftsByRank);
  assert.equal(balanceContract.CAMPAIGN_BALANCE.tributeCosts, career.CAREER_RULES.tributeCosts);
});

test('middle-office deadlines and audience demotion preserve their intentionally distinct contracts', () => {
  assert.equal(career.demotedRank('concubine', 'consort'), null);
  assert.equal(career.createDemotionNotice('concubine', 'consort', 9, 'deadline')?.toRank, 'concubine');
  assert.equal(career.tributeCost('prince', 'consort'), 10);
  assert.equal(career.standingAfterDemotion('prince', 'unknown'), 80);
  assert.equal(career.resolveCareer(undefined), null);
  assert.equal(career.startingCareerTitle(undefined), 'Courtier');
});
