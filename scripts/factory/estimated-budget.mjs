// Owns arithmetic admission for the parent’s conservative daily job estimates.
const validAmount = value => Number.isFinite(value) && value >= 0;

/** Returns the local calendar day used by the project’s daily estimated ledger. */
export function projectDay(instant = new Date(), timezone = 'Asia/Ulaanbaatar') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(instant);
  const value = name => parts.find(part => part.type === name).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

/** Checks a planning reservation, not token usage or actual billing. Never launches work. */
export function assessEstimatedJob(config, ledger, job, instant = new Date()) {
  const day = projectDay(instant, config.budgetPolicy.timezone);
  const policy = config.budgetPolicy;
  const limitUsd = day === policy.refactorDate ? policy.refactorDayLimitUsd : policy.maintenanceDailyLimitUsd;
  const held = reason => ({ allowed: false, reason, day, limitUsd });
  if (ledger?.date !== day || ledger?.timezone !== policy.timezone || ledger?.limitUsd !== limitUsd) {
    return held('Prepare the current local-day estimated ledger before new work.');
  }
  if (!Array.isArray(ledger.entries) || !job?.id || !validAmount(job.estimateUsd) || job.estimateUsd === 0) {
    return held('A positive conservative job estimate is required.');
  }
  if (ledger.entries.some(entry => !entry.id || !validAmount(entry.estimateUsd) ||
      !['recorded', 'reserved'].includes(entry.status)) ||
      new Set(ledger.entries.map(entry => entry.id)).size !== ledger.entries.length) {
    return held('The estimated ledger contains invalid or duplicate entries.');
  }
  const existing = ledger.entries.find(entry => entry.id === job.id);
  if (existing && (existing.status !== 'reserved' || existing.estimateUsd !== job.estimateUsd)) {
    return held('Completed work or a changed estimate needs a separate explicit reservation.');
  }
  const recordedAndReservedUsd = ledger.entries.reduce((sum, entry) => sum + entry.estimateUsd, 0);
  const plannedUsd = recordedAndReservedUsd + (existing ? 0 : job.estimateUsd);
  if (plannedUsd > limitUsd) return held('Estimated daily allowance would be exceeded; stop new work.');
  return { allowed: true, day, limitUsd, plannedUsd, headroomUsd: limitUsd - plannedUsd, estimateOnly: true };
}
