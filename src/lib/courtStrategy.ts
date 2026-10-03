import {courtGiftCost} from './courtHierarchy';
import { giftPositiveScale, globalSupportReward } from './campaignBalance';
import type { Character } from "../types/character";
import type { PlayerStats, PlayerType } from "../types/game";
import { processGiftWithMessage } from "./checkMessage";
import type { MessageChoice } from './giftMessages';
export type { MessageChoice } from './giftMessages';
export const giftCost = courtGiftCost;
export const supportReward = globalSupportReward;
export const formatRank = (rank: string) =>
  rank.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
// Direct effects only. Faction and cross-character reactions are applied separately.
export function previewMessage(
  character: Character,
  message: MessageChoice,
  playerType: PlayerType,
  stats: PlayerStats,
) {
  const result = processGiftWithMessage(
    message,
    {...character.personalityVectors,suspicion:character.suspicion},
    character.relationshipVectors,
    playerType,
    stats,
    character.supportLevel,
    {positiveEffectScale:giftPositiveScale(character,stats.influence)},
  );
  const suspicion =
    character.hasGivenAllegiance ? 0 : result.newPersonalityVectors.suspicion || character.suspicion;
  return {
    support: Math.round((result.newSupportLevel - character.supportLevel) * 100) / 100,
    suspicion: Math.round((suspicion - character.suspicion) * 100),
    dangerous: suspicion >= character.suspicionThreshold,
  };
}
export const signed = (value: number) => {const rounded=Math.round(value*100)/100;return `${rounded>0?"+":""}${rounded}`;};
