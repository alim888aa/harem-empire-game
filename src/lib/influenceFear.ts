/**
 * Applies initial fear to all characters based on player's starting influence
 */
export function applyInitialInfluenceFear(
  characters: Record<string, any>,
  playerInfluence: number
): void {
  if (playerInfluence <= 0) return;

  const fearIncrease = 0.1 * (playerInfluence / 1.0);

  Object.values(characters).forEach((characterRef) => {
    const snapshot = characterRef.getSnapshot();
    if (snapshot?.context?.name && snapshot.context.name !== 'Emperor') {
      // Send fear increase to character machine
      characterRef.send({
        type: 'APPLY_FEAR',
        fearAmount: fearIncrease
      });
    }
  });
}

/**
 * Applies ongoing fear increases when player influence > 0.6
 */
export function applyInfluenceFear(
  characters: Record<string, any>,
  playerInfluence: number
): void {
  if (playerInfluence <= 0.6) return;

  const fearIncrease = 0.5 * ((playerInfluence - 0.6) / 0.4);

  Object.values(characters).forEach((characterRef) => {
    const snapshot = characterRef.getSnapshot();
    if (snapshot?.context?.name && snapshot.context.name !== 'Emperor') {
      // Send fear increase to character machine
      characterRef.send({
        type: 'APPLY_FEAR',
        fearAmount: fearIncrease
      });
    }
  });
}

/**
 * Gets the high influence notification message
 */
export function getHighInfluenceNotification(): string {
  return "Your growing influence strikes fear into the hearts of courtiers...";
}

/**
 * Checks if high influence notification should be shown
 */
export function shouldShowHighInfluenceNotification(playerInfluence: number): boolean {
  return playerInfluence > 0.8;
}