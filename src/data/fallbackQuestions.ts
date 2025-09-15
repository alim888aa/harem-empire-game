import type { VictoryPath, AIQuestion } from '../types/emperorAudience';

/**
 * Fallback questions for each victory path
 * Used when AI service is unavailable or fails
 */
export const FALLBACK_QUESTIONS: Record<VictoryPath, AIQuestion[]> = {
  traditional: [
    {
      id: 'trad-1',
      text: 'What is your primary duty to the Empire?',
      options: {
        a: 'To serve the Emperor faithfully and preserve the dynasty',
        b: 'To advance my own interests and gain power',
        c: 'To protect the people from imperial tyranny'
      },
      correctAnswer: 'a',
      explanation: 'Loyalty to the Emperor and dynasty is the foundation of traditional imperial succession.'
    },
    {
      id: 'trad-2',
      text: 'How should the Empire handle rebellious provinces?',
      options: {
        a: 'Show mercy and seek peaceful resolution',
        b: 'Crush them with overwhelming force to maintain order',
        c: 'Negotiate for their independence'
      },
      correctAnswer: 'b',
      explanation: 'The Emperor values strength and order above all else in maintaining imperial unity.'
    },
    {
      id: 'trad-3',
      text: 'What makes a worthy successor to the throne?',
      options: {
        a: 'Popular support from the people',
        b: 'Unwavering loyalty to imperial traditions',
        c: 'Military strength and conquest'
      },
      correctAnswer: 'b',
      explanation: 'Traditional succession requires absolute commitment to preserving imperial customs and hierarchy.'
    }
  ],
  'shadow-ruler': [
    {
      id: 'shadow-1',
      text: 'What is the most effective way to influence imperial policy?',
      options: {
        a: 'Through direct confrontation and demands',
        b: 'By working quietly behind the scenes',
        c: 'Through public speeches and rallies'
      },
      correctAnswer: 'b',
      explanation: 'True power lies in subtle influence that preserves the Emperor\'s dignity while achieving your goals.'
    },
    {
      id: 'shadow-2',
      text: 'How should one handle incompetent officials?',
      options: {
        a: 'Replace them immediately with public executions',
        b: 'Guide them subtly toward better decisions',
        c: 'Expose their failures to the people'
      },
      correctAnswer: 'b',
      explanation: 'A shadow ruler maintains stability by correcting problems without creating public disruption.'
    },
    {
      id: 'shadow-3',
      text: 'What is the key to maintaining imperial stability?',
      options: {
        a: 'Strong military presence in all provinces',
        b: 'Careful balance of competing interests',
        c: 'Complete transparency in all government actions'
      },
      correctAnswer: 'b',
      explanation: 'Stability comes from managing all factions and interests without letting any become too powerful.'
    }
  ],
  revolutionary: [
    {
      id: 'rev-1',
      text: 'What is your vision for the Empire\'s future?',
      options: {
        a: 'A reformed system that serves the people better',
        b: 'Complete destruction of the current order',
        c: 'Maintaining the status quo with minor adjustments'
      },
      correctAnswer: 'a',
      explanation: 'Revolutionary change must be presented as improvement, not destruction, to avoid execution.'
    },
    {
      id: 'rev-2',
      text: 'How should power be distributed in the Empire?',
      options: {
        a: 'Concentrated in the hands of the worthy few',
        b: 'Shared among representatives of the people',
        c: 'Maintained by the current imperial system'
      },
      correctAnswer: 'b',
      explanation: 'Revolutionary ideals focus on broader representation while avoiding direct threats to the Emperor.'
    },
    {
      id: 'rev-3',
      text: 'What is your stance on the current imperial policies?',
      options: {
        a: 'They require gradual, careful reform',
        b: 'They are fundamentally flawed and must be replaced',
        c: 'They are perfect as they stand'
      },
      correctAnswer: 'a',
      explanation: 'Gradual reform appears less threatening than radical change while still achieving revolutionary goals.'
    }
  ],
  survivor: [
    {
      id: 'surv-1',
      text: 'Why should the Empire spare your life?',
      options: {
        a: 'Because I can still serve the Empire faithfully',
        b: 'Because I have powerful allies who will avenge me',
        c: 'Because the people will revolt if you execute me'
      },
      correctAnswer: 'a',
      explanation: 'Survival depends on demonstrating continued value and loyalty to the Emperor.'
    },
    {
      id: 'surv-2',
      text: 'What have you learned from your mistakes?',
      options: {
        a: 'That loyalty to the Emperor is paramount',
        b: 'That I should have been more careful not to get caught',
        c: 'That the system itself is corrupt'
      },
      correctAnswer: 'a',
      explanation: 'True contrition requires acknowledging the Emperor\'s authority and your failure to honor it.'
    },
    {
      id: 'surv-3',
      text: 'How will you prove your renewed loyalty?',
      options: {
        a: 'Through humble service and obedience',
        b: 'By exposing other traitors to the throne',
        c: 'By leading military campaigns for the Empire'
      },
      correctAnswer: 'a',
      explanation: 'Humility and service demonstrate genuine repentance better than grand gestures or betrayals.'
    }
  ]
};

/**
 * Get fallback questions for a specific victory path
 */
export function getFallbackQuestions(path: VictoryPath): AIQuestion[] {
  return FALLBACK_QUESTIONS[path] || [];
}