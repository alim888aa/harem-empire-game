import type { FactionType } from '../lib/factionSystem';

// Victory path types
export type VictoryPath = 'traditional' | 'shadow-ruler' | 'revolutionary' | 'survivor';

// AI Question structure
export interface AIQuestion {
  id: string;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
  };
  correctAnswer: 'a' | 'b' | 'c';
  explanation?: string;
}

// Path-specific context interfaces
export interface RevolutionaryContext {
  influence: number;
  ambition: number;
  loyalty: number;
  fear: number;
  politicalSkill: number;
  factionMemberCounts: Record<string, number>;
  suspiciousCharacters: number;
  characterType: string;
}

export interface TraditionalContext {
  influence: number;
  loyalty: number;
  perceivedLoyalty: number;
  perceivedThreat: number;
  suspiciousCharacters: number;
  factionMemberCounts: Record<string, number>;
  characterType: string;
}

export interface ShadowRulerContext {
  influence: number;
  perceivedLoyalty: number;
  politicalSkill: number;
  factionMemberCounts: Record<string, number>;
  characterType: string;
}

export interface SurvivorContext {
  perceivedLoyalty: number;
  perceivedThreat: number;
}

// Union type for game context data
export type GameContextData = 
  | { path: 'revolutionary'; data: RevolutionaryContext }
  | { path: 'traditional'; data: TraditionalContext }
  | { path: 'shadow-ruler'; data: ShadowRulerContext }
  | { path: 'survivor'; data: SurvivorContext };

// Emperor audience event types for state machine communication
export type EmperorAudienceEvent =
  | { type: 'ENTER_AUDIENCE' }
  | { type: 'REFUSE' }
  | { type: 'ANSWER_QUESTION'; answer: string }
  | { type: 'QUESTIONS_GENERATED'; questions: AIQuestion[] }
  | { type: 'OUTCOME_DETERMINED'; outcome: 'victory' | 'execution' | 'failure'; message: string };

// Emperor audience machine context
export interface EmperorAudienceContext {
  victoryPath: VictoryPath;
  gameContext: GameContextData;
  questions: AIQuestion[];
  answers: string[];
  currentQuestionIndex: number;
  outcome: 'victory' | 'execution' | 'failure' | null;
  emperorMessage: string;
}

// Victory path configuration
export interface VictoryPathConfig {
  name: string;
  backgroundImage: string;
  triggerConditions: {
    faction?: FactionType;
    promotion?: boolean;
    suspicionThreshold?: boolean;
  };
  successMessage: string;
  failureMessage: string;
}

// AI service input/output types
export interface AIQuestionGenerationInput {
  path: VictoryPath;
  gameContext: GameContextData;
}

export interface AIQuestionGenerationOutput {
  questions: AIQuestion[];
}

export interface AIOutcomeJudgmentInput {
  path: VictoryPath;
  questions: AIQuestion[];
  answers: string[];
  gameContext: GameContextData;
}

export interface AIOutcomeJudgmentOutput {
  outcome: 'victory' | 'execution' | 'failure';
  message: string;
}