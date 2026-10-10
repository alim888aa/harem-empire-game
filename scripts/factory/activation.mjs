// Validates manual factory configuration and holds unsupported stock T3 execution.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Reports why stock T3 CLI execution is unsupported; parent manual dispatch is separate. */
export function assessActivation(config) {
  const reasons = [];
  if (config?.execution?.mode !== 'parent-manual' || config?.execution?.enabled !== true ||
      config?.execution?.automatic !== false) {
    reasons.push('Use parent manual cloud dispatch; stock automatic T3 dispatch is unsupported.');
  }
  if (config?.execution?.location !== 'cloud') reasons.push('Cloud-only execution is required.');
  const roles = {
    jobs: ['owner', 'build', 'review-*', 'verifier', 'hunt', 'dispatch', 'triage', 'manager', 'watch', 'research', 'scout', 'upkeep', 'audit'],
    council: ['client', 'maintainer']
  };
  for (const [group, required] of Object.entries(roles)) {
    const entries = config?.[group];
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      reasons.push(`${group} must declare its required roles.`);
      continue;
    }
    for (const role of required) {
      if (!Object.hasOwn(entries, role)) reasons.push(`${group}.${role} is missing.`);
    }
    for (const [role, job] of Object.entries(entries)) {
      if (job?.provider !== 'codex' || job?.model !== 'gpt-6.1-sol') {
        reasons.push(`${group}.${role} must use GPT-6.1 Sol.`);
      }
    }
  }
  const budget = config?.budgetPolicy;
  if (budget?.accounting !== 'flat-job-estimates' || budget?.timezone !== 'Asia/Ulaanbaatar' ||
      budget?.refactorDate !== '2026-10-10' || budget?.refactorDayLimitUsd !== 100 ||
      budget?.maintenanceDailyLimitUsd !== 30 || budget?.maintenanceWhenNeeded !== true ||
      budget?.priorityBypass !== false || budget?.atEstimatedLimit !== 'stop-new-work-running-work-finishes') {
    reasons.push('Record conservative daily estimates under the approved refactor/maintenance policy.');
  }
  return { allowed: false, configurationValid: reasons.length === 0, reasons: [
    ...reasons,
    'Stock T3 CLI dispatch is unsupported; parent manual native-Sol dispatch uses estimated job accounting.'
  ] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));
  process.stdout.write(`${JSON.stringify(assessActivation(config), null, 2)}\n`);
  process.exitCode = 1;
}
