import { setup, assign, fromPromise, sendParent } from 'xstate';
import type {
  VictoryPath,
  GameContextData,
  AIQuestion,
  EmperorAudienceContext,
  AIQuestionGenerationInput,
  AIOutcomeJudgmentInput
} from '../types/emperorAudience';
import { normalizeContextData } from '../lib/emperorAudience';
import { generateQuestions, judgeOutcome } from '../lib/aiServices';
import { getFallbackQuestions } from '../data/fallbackQuestions';

// AI service actors for async operations
const generateQuestionsActor = fromPromise(async ({ input }: { input: AIQuestionGenerationInput }) => {
  return await generateQuestions(input);
});

const judgeOutcomeActor = fromPromise(async ({ input }: { input: AIOutcomeJudgmentInput }) => {
  return await judgeOutcome(input);
});

export const emperorAudienceMachine = setup({
  types: {
    context: {} as EmperorAudienceContext,
    events: {} as
      | { type: 'ANSWER_QUESTION'; answer: string }
      | { type: 'QUESTIONS_GENERATED'; questions: AIQuestion[] }
      | { type: 'OUTCOME_DETERMINED'; outcome: 'victory' | 'execution' | 'failure'; message: string },
    input: {} as {
      victoryPath: VictoryPath;
      gameContext: GameContextData;
    },
    output: {} as {
      outcome: 'victory' | 'execution' | 'failure' | null;
      message: string;
    }
  },
  actors: {
    generateQuestionsActor,
    judgeOutcomeActor
  }
}).createMachine({
  id: 'emperorAudience',
  initial: 'generating_questions',
  context: ({ input }) => ({
    victoryPath: input.victoryPath,
    gameContext: normalizeContextData(input.gameContext),
    questions: [],
    answers: [],
    currentQuestionIndex: 0,
    outcome: null,
    emperorMessage: ''
  }),
  states: {
    generating_questions: {
      invoke: {
        src: 'generateQuestionsActor',
        input: ({ context }) => ({
          path: context.victoryPath,
          gameContext: context.gameContext
        }),
        onDone: {
          target: 'asking_questions',
          actions: assign({
            questions: ({ event }) => event.output.questions
          })
        },
        onError: {
          target: 'asking_questions',
          actions: assign({
            questions: ({ context }) => getFallbackQuestions(context.victoryPath)
          })
        }
      },
      // Add timeout for AI service calls
      after: {
        30000: {
          target: 'asking_questions',
          actions: assign({
            questions: ({ context }) => getFallbackQuestions(context.victoryPath)
          })
        }
      }
    },
    asking_questions: {
      on: {
        ANSWER_QUESTION: {
          actions: assign({
            answers: ({ context, event }) => [...context.answers, event.answer],
            currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1
          })
        }
      },
      always: [
        {
          guard: ({ context }) => context.answers.length >= 3,
          target: 'judging_outcome'
        }
      ]
    },
    judging_outcome: {
      invoke: {
        src: 'judgeOutcomeActor',
        input: ({ context }) => ({
          path: context.victoryPath,
          questions: context.questions,
          answers: context.answers,
          gameContext: context.gameContext
        }),
        onDone: {
          target: 'audience_complete',
          actions: assign({
            outcome: ({ event }) => {
              console.log('Outcome judgment completed:', event.output);
              return event.output.outcome;
            },
            emperorMessage: ({ event }) => event.output.message
          })
        },
        onError: {
          target: 'audience_complete',
          actions: assign({
            outcome: ({ event }) => {
              console.log('Outcome judgment error:', event);
              return 'failure';
            },
            emperorMessage: 'The Emperor dismisses you without judgment.'
          })
        }
      },
      // Add timeout for AI service calls
      after: {
        30000: {
          target: 'audience_complete',
          actions: assign({
            outcome: 'failure',
            emperorMessage: 'The Emperor grows impatient and dismisses you.'
          })
        }
      }
    },
    audience_complete: {
      type: 'final',
      entry: [
        ({ context }) => {
          console.log('Emperor audience completing with context:', context);
        },
        sendParent(({ context }) => {
          const result = {
            type: 'EMPEROR_AUDIENCE_COMPLETE' as const,
            outcome: context.outcome,
            message: context.emperorMessage
          };
          console.log('Sending result to parent:', result);
          return result;
        })
      ],
      output: ({ context }) => {
        const output = {
          outcome: context.outcome,
          message: context.emperorMessage
        };
        console.log('Emperor audience machine final output:', output);
        return output;
      }
    }
  }
});