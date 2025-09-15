# Emperor Audience Events Design Document

## Overview

The Emperor Audience Events system provides alternative victory paths through AI-generated political encounters that serve as climactic endgame scenarios. This system integrates with the existing faction mechanics, player statistics, and state machine architecture to create dynamic, contextual encounters where players face the Emperor in high-stakes political conversations.

The system introduces four distinct victory paths (Traditional, Shadow Ruler, Revolutionary, Survivor) each with unique triggers, contexts, and outcomes. Success depends on both the player's answers to AI-generated questions and their accumulated political development throughout the game.

## Architecture

### State Machine Integration

The system integrates with the existing `gameMachine` by adding event trigger guards and a new `emperor_audience` state:

```typescript
// Modified PROMOTED event handling in gameMachine
always: [
  {
    guard: { type: "canBeEmperor" },
    target: '#gameMachine.game_over',
    actions: assign({ gameEndReason: 'victory' })
  },
  {
    guard: { type: "canBePromoted" },
    actions: [/* existing promotion logic */]
  },
  {
    // New guard for emperor audience events
    guard: { type: "shouldOfferEmperorAudience" },
    target: 'emperor_audience_offer'
  }
]

// New states added to gameMachine
emperor_audience_offer: {
  on: {
    ENTER_AUDIENCE: {
      target: 'emperor_audience'
    },
    REFUSE: [
      {
        guard: ({ context }) => isAtMaxSuspicion(context),
        target: 'game_over',
        actions: assign({ gameEndReason: 'defeat' })
      },
      {
        target: 'playing'
      }
    ]
  }
},

emperor_audience: {
  invoke: {
    src: 'emperorAudienceMachine',
    input: ({ context }) => ({
      victoryPath: determineVictoryPath(context),
      gameContext: extractGameContext(context)
    }),
    onDone: [
      {
        guard: ({ event }) => event.output.outcome === 'victory',
        target: 'game_over',
        actions: assign({ gameEndReason: 'victory' })
      },
      {
        guard: ({ event }) => event.output.outcome === 'execution',
        target: 'game_over',
        actions: assign({ gameEndReason: 'defeat' })
      },
      {
        guard: ({ event }) => event.output.outcome === 'failure',
        target: 'playing',
        actions: [
          assign({
            rank: null,
            playerPersonality: ({ context }) => ({
              ...context.playerPersonality,
              influence: Math.max(0, context.playerPersonality.influence - 0.4)
            })
          })
        ]
      }
    ]
  }
}
```

**Design Rationale**: Using `invoke` rather than `spawn` ensures the audience machine is automatically cleaned up when the state exits, and `onDone` provides clean communication back to the parent machine. The `emperor_audience_offer` state provides the player choice UI before entering the audience.

### Victory Path Determination

Victory paths are determined by faction membership and game conditions:

```typescript
function determineVictoryPath(context: GameContext): VictoryPath {
  // Check execution threshold first (Survivor path)
  const executionThresholds = { concubine: 1, minister: 3, prince: 5 };
  const threshold = executionThresholds[context.characterType];
  if (context.suspiciousCharacters.length >= threshold) {
    return 'survivor';
  }
  
  // Check faction-based paths (requires promotion)
  if (context.rank && context.factionSystem.playerFaction) {
    switch (context.factionSystem.playerFaction) {
      case 'Imperial': return 'traditional';
      case 'Loyalist': return 'shadow-ruler';
      case 'Rebel': return 'revolutionary';
    }
  }
  
  return null; // No victory path available
}
```

**Design Rationale**: Faction membership takes precedence over suspicion-based paths to encourage strategic faction play. The Survivor path serves as a last-chance mechanism for players facing execution.

### UI Layout Design

The emperor audience interface features:

- **Background**: Full-screen victory path-specific background image with transparent gradient overlay
- **Question Container**: Centered container with semi-transparent background containing:
  - Question text at the top
  - Three multiple choice options (A, B, C) as clickable buttons
  - Progress indicator showing current question (1/3, 2/3, 3/3)
- **Emperor Message**: Final outcome message displayed in the same centered container

```typescript
// UI Component Structure
<div className="emperor-audience-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
  <div className="gradient-overlay" />
  <div className="question-container">
    {/* Question content */}
  </div>
</div>
```

### State Machine Communication

The communication flow between machines:

1. **Trigger Detection**: `shouldOfferEmperorAudience` guard checks victory path conditions on promotion
2. **Player Choice**: `emperor_audience_offer` state presents "Enter Audience" / "Refuse" options
3. **Machine Invocation**: `emperor_audience` state invokes the audience machine with game context
4. **Result Communication**: Audience machine sends final outcome via `onDone` event
5. **State Transition**: Parent machine transitions to appropriate end state based on outcome

## Components and Interfaces

### Emperor Audience State Machine

```typescript
export const emperorAudienceMachine = setup({
  types: {
    context: {} as {
      victoryPath: VictoryPath;
      gameContext: GameContextData;
      questions: AIQuestion[];
      answers: string[];
      currentQuestionIndex: number;
      outcome: 'victory' | 'execution' | 'failure' | null;
      emperorMessage: string;
    },
    events: {} as
      | { type: 'ANSWER_QUESTION', answer: string }
      | { type: 'QUESTIONS_GENERATED', questions: AIQuestion[] }
      | { type: 'OUTCOME_DETERMINED', outcome: string, message: string }
  }
}).createMachine({
  initial: 'generating_questions',
  states: {
    generating_questions: {
      invoke: {
        src: 'generateQuestions',
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
            questions: ({ context }) => generateFallbackQuestions(context.victoryPath)
          })
        }
      }
    },
    asking_questions: {
      on: {
        ANSWER_QUESTION: {
          actions: [
            assign({
              answers: ({ context, event }) => [...context.answers, event.answer],
              currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1
            })
          ]
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
        src: 'judgeOutcome',
        input: ({ context }) => ({
          path: context.victoryPath,
          questions: context.questions,
          answers: context.answers,
          gameContext: context.gameContext
        }),
        onDone: {
          target: 'audience_complete',
          actions: assign({
            outcome: ({ event }) => event.output.outcome,
            emperorMessage: ({ event }) => event.output.message
          })
        },
        onError: {
          target: 'audience_complete',
          actions: assign({
            outcome: 'failure',
            emperorMessage: 'The Emperor dismisses you without judgment.'
          })
        }
      }
    },
    audience_complete: {
      type: 'final'
    }
  }
});
```

### AI Integration Services

```typescript
// AI Question Generation Service
async function generateQuestions(input: {
  path: VictoryPath;
  gameContext: GameContextData;
}): Promise<{ questions: AIQuestion[] }> {
  const prompt = buildQuestionPrompt(input.path, input.gameContext);
  const response = await callAI(prompt);
  return { questions: parseQuestions(response) };
}

// AI Outcome Judgment Service  
async function judgeOutcome(input: {
  path: VictoryPath;
  questions: AIQuestion[];
  answers: string[];
  gameContext: GameContextData;
}): Promise<{ outcome: string; message: string }> {
  const prompt = buildJudgmentPrompt(input);
  const response = await callAI(prompt);
  return parseOutcome(response);
}
```

**Design Rationale**: Separating AI calls into dedicated services allows for easier testing, error handling, and potential future enhancements like caching or fallback responses.

### Context Data Types

```typescript
// Path-specific context interfaces
interface RevolutionaryContext {
  influence: number;
  ambition: number;
  loyalty: number;
  fear: number;
  politicalSkill: number;
  factionMemberCounts: Record<string, number>;
  suspiciousCharacters: number;
  characterType: string;
}

interface TraditionalContext {
  influence: number;
  loyalty: number;
  perceivedLoyalty: number;
  perceivedThreat: number;
  suspiciousCharacters: number;
  factionMemberCounts: Record<string, number>;
  characterType: string;
}

interface ShadowRulerContext {
  influence: number;
  perceivedLoyalty: number;
  politicalSkill: number;
  factionMemberCounts: Record<string, number>;
  characterType: string;
}

interface SurvivorContext {
  perceivedLoyalty: number;
  perceivedThreat: number;
}

type GameContextData = 
  | { path: 'revolutionary'; data: RevolutionaryContext }
  | { path: 'traditional'; data: TraditionalContext }
  | { path: 'shadow-ruler'; data: ShadowRulerContext }
  | { path: 'survivor'; data: SurvivorContext };
```

**Design Rationale**: Strongly typed context data ensures the AI receives consistent, relevant information for each victory path while preventing data leakage between different path types.

## Data Models

### AI Question Structure

```typescript
interface AIQuestion {
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
```

### Victory Path Configuration

```typescript
interface VictoryPathConfig {
  name: string;
  backgroundImage: string;
  triggerConditions: {
    faction?: FactionType;
    promotion?: boolean;
    suspicionThreshold?: boolean;
  };
  contextExtractor: (gameContext: any) => any;
  successMessage: string;
  failureMessage: string;
}

const VICTORY_PATHS: Record<VictoryPath, VictoryPathConfig> = {
  traditional: {
    name: 'Traditional Path',
    backgroundImage: 'traditional-path.png',
    triggerConditions: { faction: 'Imperial', promotion: true },
    contextExtractor: extractTraditionalContext,
    successMessage: 'The Emperor recognizes your legitimate claim to succession...',
    failureMessage: 'Your loyalty is questioned, demotion follows...'
  },
  // ... other paths
};
```

## Error Handling

### AI Service Failures

```typescript
// Fallback question generation
function generateFallbackQuestions(path: VictoryPath): AIQuestion[] {
  const fallbackQuestions = {
    traditional: [
      {
        id: 'trad-1',
        text: 'What is your primary duty to the Empire?',
        options: {
          a: 'To serve the Emperor faithfully',
          b: 'To advance my own interests', 
          c: 'To protect the people'
        },
        correctAnswer: 'a'
      }
      // ... more fallback questions
    ]
    // ... other paths
  };
  
  return fallbackQuestions[path] || [];
}

// Graceful degradation in audience machine
generating_questions: {
  invoke: {
    src: 'generateQuestions',
    onError: {
      target: 'asking_questions',
      actions: assign({
        questions: ({ context }) => generateFallbackQuestions(context.victoryPath)
      })
    }
  }
}
```

### State Machine Error Recovery

```typescript
// Timeout handling for AI calls
generating_questions: {
  after: {
    30000: { // 30 second timeout
      target: 'asking_questions',
      actions: assign({
        questions: ({ context }) => generateFallbackQuestions(context.victoryPath)
      })
    }
  }
}
```

**Design Rationale**: Robust error handling ensures the game remains playable even when AI services fail, maintaining user experience through fallback content.

## Testing Strategy

### Manual UI Testing Approach

Following the project's testing guidelines, all testing will be performed through the game UI:

1. **Victory Path Triggers**: Test each faction membership and promotion combination to verify correct path offerings
2. **Question Generation**: Verify AI questions are contextually appropriate for each path
3. **Answer Validation**: Test various answer combinations to ensure outcomes align with player development
4. **State Transitions**: Verify smooth transitions between audience states and back to main game
5. **Error Scenarios**: Test AI service failures and timeout conditions

### Test Scenarios

```typescript
// Test case examples (for manual execution)
const testScenarios = [
  {
    name: 'Traditional Path Success',
    setup: 'Imperial faction, high loyalty, promoted prince',
    expected: 'Victory outcome with succession message'
  },
  {
    name: 'Revolutionary Path Execution',
    setup: 'Rebel faction, high suspicion, wrong answers',
    expected: 'Execution outcome'
  },
  {
    name: 'Survivor Path Escape',
    setup: 'Max suspicion threshold, high perceived loyalty',
    expected: 'Victory outcome with escape message'
  }
];
```

### Integration Testing

- **Faction System Integration**: Verify faction membership correctly determines available paths
- **Player Stats Integration**: Ensure player statistics properly influence AI judgment
- **State Machine Integration**: Test transitions between main game and audience states
- **UI Integration**: Verify background images and victory messages display correctly

## Implementation Considerations

### Performance Optimization

- **AI Call Caching**: Cache generated questions for repeated playthroughs
- **Background Preloading**: Preload victory path background images during game initialization
- **Context Data Normalization**: Normalize numeric values once during context extraction

### Security Considerations

- **Input Sanitization**: Sanitize all context data before passing to AI services
- **Response Validation**: Validate AI responses match expected formats
- **Fallback Content**: Ensure fallback questions maintain game balance

### Accessibility

- **Screen Reader Support**: Ensure question text and options are properly labeled
- **Keyboard Navigation**: Support keyboard-only navigation through questions
- **Visual Indicators**: Provide clear visual feedback for question progression

## Future Enhancements

### Potential Extensions

1. **Multiple Question Sets**: Generate different questions for repeat playthroughs
2. **Dynamic Difficulty**: Adjust question difficulty based on player skill level
3. **Branching Conversations**: Add follow-up questions based on previous answers
4. **Emperor Personality**: Develop consistent Emperor personality across encounters

### Scalability Considerations

- **Question Database**: Move from AI generation to curated question database
- **Localization Support**: Structure for multiple language support
- **Analytics Integration**: Track player success rates by path and context

This design provides a robust foundation for the Emperor Audience Events system while maintaining integration with existing game architecture and following established development patterns.