import type { GiftWithMessageResult } from './checkMessage';

/** Authored dialogue, not a free-text interpreter. Every accepted gift resolves
 * one of these nonblank messages before any resource or relationship changes. */
export const GIFT_MESSAGES = [
  { type: 'ambitious', title: 'Ambitious words', text: 'Together, we could change this court.' },
  { type: 'loyal', title: 'Loyal words', text: 'The empire is stronger when we stand together.' },
  { type: 'cautious', title: 'Cautious words', text: 'These halls have ears. Let us tread carefully.' },
  { type: 'neutral', title: 'Neutral words', text: 'A small token of my respect.' },
] as const;

export type MessageChoice = typeof GIFT_MESSAGES[number]['type'];
export function giftMessage(choice: unknown) {
  return typeof choice === 'string'
    ? GIFT_MESSAGES.find(message => message.type === choice && message.text.trim().length > 0)
    : undefined;
}

export function validGiftRequestId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && value.trim() === value;
}

/** A failed/malformed evaluation must be refundable, never strand a pending gift. */
export function validGiftResult(value: unknown): value is GiftWithMessageResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<GiftWithMessageResult>;
  const bounded = (number: unknown) => typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= 1;
  return typeof result.newSupportLevel === 'number' && Number.isFinite(result.newSupportLevel) &&
    result.newSupportLevel >= 0 && result.newSupportLevel <= 100 && Number.isFinite(result.supportDelta) &&
    ['ambitious_positive', 'loyal_suspicious', 'loyal_positive', 'ambitious_dismissive', 'fearful_appreciative', 'neutral'].includes(result.responseType ?? '') &&
    (['trust', 'fear', 'ambition', 'loyalty', 'influence', 'romantic', 'suspicion'] as const)
      .every(key => bounded(result.newPersonalityVectors?.[key])) &&
    (['fearOfPlayer', 'loveForPlayer'] as const)
      .every(key => bounded(result.newRelationshipVectors?.[key]));
}
