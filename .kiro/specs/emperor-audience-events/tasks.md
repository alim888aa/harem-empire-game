# Emperor Audience Events Implementation Plan

## Overview

This implementation plan converts the Emperor Audience Events design into actionable coding tasks. The system provides alternative victory paths through AI-generated political encounters where players face the Emperor in high-stakes conversations.

## Expected UI Components

### EmperorAudienceOffer Component
- Modal-style overlay with imperial styling
- Title: "The Emperor Requests an Audience"
- Two buttons: "Enter Audience" and "Refuse"
- Victory path description text
- Warning text for Survivor path: "Refusing may result in execution"

### EmperorAudienceScreen Component
- Full-screen background image based on victory path:
  - Traditional: Imperial throne room
  - Shadow Ruler: Dimly lit private chamber
  - Revolutionary: Tense court with overturned furniture
  - Survivor: Foreboding judgment hall
- Centered question container with semi-transparent background
- Question text and three multiple choice options (A, B, C)
- Progress indicator (1/3, 2/3, 3/3)
- Final emperor message display

## Implementation Tasks

- [x] 1. Create core emperor audience types and interfaces





  - Create `src/types/emperorAudience.ts` with victory path types and context interfaces
  - Define `VictoryPath`, `AIQuestion`, `GameContextData` types
  - Create path-specific context interfaces: `RevolutionaryContext`, `TraditionalContext`, `ShadowRulerContext`, `SurvivorContext`
  - Add emperor audience event types for state machine communication
  - _Requirements: 13.2_

- [x] 2. Implement emperor audience utility functions





  - Create `src/lib/emperorAudience.ts` with core logic functions
  - Implement `shouldOfferEmperorAudience` function to check victory path conditions
  - Implement `determineVictoryPath` function for faction-based and suspicion-based path detection
  - Implement `extractGameContext` function to create path-specific context data
  - Add context data normalization functions for AI consumption
  - _Requirements: 11.1, 13.1, 13.2_

- [x] 3. Create emperor audience state machine





  - Create `src/state-machines/emperor-audience-machine.ts` with complete state machine
  - Implement states: `generating_questions`, `asking_questions`, `judging_outcome`, `audience_complete`
  - Add AI service invocations for question generation and outcome judgment
  - Implement fallback question generation for AI failures
  - Add timeout handling and error recovery mechanisms
  - _Requirements: 11.2, 12.1, 12.2_

- [x] 4. Create emperor audience offer UI component





  - Create `src/components/EmperorAudienceOffer.tsx` for player choice interface
  - Implement modal overlay with imperial styling and background
  - Add victory path description text based on determined path
  - Add "Enter Audience" and "Refuse" buttons with proper event handling
  - Include warning text for Survivor path about execution risk
  - _Requirements: 11.1_

- [x] 5. Create emperor audience screen UI component





  - Create `src/components/EmperorAudienceScreen.tsx` for question interface
  - Implement full-screen background image display based on victory path
  - Add centered question container with semi-transparent styling
  - Implement question display with three multiple choice options
  - Add progress indicator showing current question number
  - Add final emperor message display for outcome
  - Add victory path background images to `public/` directory
  - Create `traditional-path.png` - grand imperial throne room
  - Create `shadow-ruler-path.png` - dimly lit private chamber
  - Create `revolutionary-path.png` - tense court with overturned furniture
  - Create `survivor-path.png` - foreboding judgment hall
  - _Requirements: 11.2, 12.1_

- [x] 6. Implement AI service integration





  - Create AI question generation service in `src/lib/aiServices.ts`
  - Implement `generateQuestions` function with path-specific prompts using ChatGPT-5-nano
  - Implement `judgeOutcome` function with context-aware judgment using ChatGPT-5-nano
  - Add prompt building functions for each victory path
  - Add response parsing and validation functions
  - Include fallback content for AI service failures
  - _Requirements: 12.1, 12.2_

- [x] 7. Update game machine integration





  - Remove existing broken imports from `src/state-machines/game-machine.ts`
  - Add proper imports for emperor audience functionality
  - Verify `shouldOfferEmperorAudience` guard integration
  - Verify `emperor_audience_offer` and `emperor_audience` states
  - Test state machine transitions and outcome handling
  - _Requirements: 11.1, 11.2_

- [x] 8. Update main game layout for emperor audience states





  - Modify `src/components/GameLayout.tsx` to handle emperor audience states
  - Add conditional rendering for `EmperorAudienceOffer` component
  - Add conditional rendering for `EmperorAudienceScreen` component
  - Ensure proper state machine event dispatching
  - _Requirements: 11.1, 11.2_

- [x] 9. Implement victory path outcome handling






  - Update `src/components/GameOverScreen.tsx` to handle emperor audience victories
  - Add path-specific victory messages and styling
  - Implement defeat handling for execution outcomes
  - Add failure handling for demotion and influence loss
  - _Requirements: 12.2, 13.1_

- [ ] 10. Add one-attempt-per-game tracking
  - Extend game context to track attempted victory paths
  - Modify victory path detection to prevent repeated attempts
  - Update `shouldOfferEmperorAudience` to check attempt history
  - _Requirements: 13.1_

- [ ] 11. Create fallback question content
  - Add hardcoded fallback questions for each victory path in `src/data/fallbackQuestions.ts`
  - Ensure fallback questions maintain game balance and Emperor personality
  - Test fallback system when AI services are unavailable
  - _Requirements: 12.1_

- [ ] 12. Integration testing and validation
  - Test all four victory path triggers through UI gameplay
  - Verify AI question generation and outcome judgment
  - Test error handling and fallback mechanisms
  - Validate state machine transitions and UI updates
  - Test victory/defeat/failure outcomes and proper game state updates
  - _Requirements: 11.1, 11.2, 12.1, 12.2, 13.1_

## Implementation Notes

- Each task builds incrementally on previous tasks
- Focus on minimal viable implementation first, then enhance
- Maintain existing game architecture patterns
- Use existing state machine and component patterns
- Prioritize error handling and graceful degradation
- Test through UI gameplay rather than automated tests

## Success Criteria

- Players can trigger emperor audience events based on faction membership and game conditions
- AI generates contextual questions appropriate for each victory path
- Player answers are judged fairly based on both correctness and political context
- Victory/defeat/failure outcomes properly transition game state
- UI provides cinematic and immersive emperor audience experience
- System handles AI failures gracefully with fallback content+