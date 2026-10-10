// Owns factory admission while supported cloud accounting and execution are absent.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Reports activation blockers without launching a job or reading session logs. */
export function assessActivation(config) {
  const reasons = [];
  if (config?.execution?.enabled !== false) {
    reasons.push('Dispatch must remain disabled until the cloud adapter is implemented.');
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
  if (!['refactor', 'ongoing'].includes(budget?.activePhase)) reasons.push('Budget phase is unknown.');
  if (budget?.refactor?.limitUsd !== 100 || budget?.refactor?.period !== 'total' ||
      budget?.ongoing?.limitUsd !== 30 || budget?.ongoing?.period !== 'day' ||
      budget?.ongoing?.timezone !== 'UTC' || budget?.priorityBypass !== false ||
      budget?.onUnknownUsage !== 'hold-all') {
    reasons.push('The separate refactor and daily budgets must fail closed without priority bypass.');
  }
  // Configuration cannot supply an accounting adapter or turn a declared limit into enforcement.
  return { allowed: false, configurationValid: reasons.length === 0, reasons: [
    ...reasons,
    'Supported cost-bounded cloud launcher and actual accounting are unavailable.',
    'Exact-head independent cloud browser proof is unavailable.'
  ] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));
  process.stdout.write(`${JSON.stringify(assessActivation(config), null, 2)}\n`);
  process.exitCode = 1;
}
