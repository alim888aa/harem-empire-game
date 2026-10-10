/** Keeps dialogue and its actions bound to courtier identity while rosters reorder. */
export function selectCourtier<T extends {name: string}>(
  characters: readonly T[], index: number, conversation: string | null,
): T | undefined {
  if (conversation) return characters.find(character => character.name === conversation);
  return characters[Math.max(0, Math.min(index, characters.length - 1))];
}
