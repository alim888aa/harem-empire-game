# Emperor Audience Events Requirements Document

## Introduction

This document outlines the requirements for the Emperor Audience Event system that provides alternative victory paths through AI-generated political encounters. This system builds upon the existing faction mechanics and player statistics to create dynamic, contextual endgame scenarios where players face the Emperor in high-stakes political conversations.

The system introduces four distinct victory paths (Traditional, Shadow Ruler, Revolutionary, Survivor) each triggered by specific game conditions and resolved through AI-generated questions and imperial judgment.

## Requirements

### Requirement 11.1: Event Trigger System

**User Story:** As a player, I want to be offered special emperor audience events when I meet specific victory path conditions, so that I can attempt alternative victory routes or face consequences for my political choices.

#### Acceptance Criteria

1. WHEN player is in Imperial faction AND gets promoted THEN Traditional Path event SHALL be offered
2. WHEN player is in Loyalist faction AND gets promoted THEN Shadow Ruler Path event SHALL be offered  
3. WHEN player is in Rebel faction AND gets promoted THEN Revolutionary Path event SHALL be offered
4. WHEN player reaches maximum suspicious characters threshold THEN Survivor Path event SHALL be offered
5. WHEN event is offered THEN player SHALL have choice to "Enter Audience" or "Refuse"
6. WHEN player chooses "Enter Audience" THEN game SHALL transition to emperor audience state machine
7. WHEN player chooses "Refuse" AND is at max suspicion THEN game SHALL transition to execution
8. WHEN player chooses "Refuse" AND is not at max suspicion THEN game SHALL continue normal gameplay

### Requirement 11.2: Emperor Audience State Machine

**User Story:** As a player, I want a dedicated emperor audience experience with cinematic presentation and structured interaction flow, so that I feel the gravity and importance of these pivotal political moments.

#### Acceptance Criteria

1. WHEN audience begins THEN state machine SHALL display appropriate background image for victory path
2. WHEN Traditional Path THEN background SHALL be "A grand imperial throne room with golden pillars and red silk banners, ornate dragon motifs carved into marble walls, the Emperor sits regally on an elevated jade throne bathed in warm golden light, camera angle from below looking up at the throne, creating a sense of reverence and legitimacy"
3. WHEN Shadow Ruler Path THEN background SHALL be "A dimly lit private imperial chamber with heavy curtains and flickering candlelight, the Emperor appears frail and sickly in his chair, shadows dance across ornate screens and silk tapestries, camera angle from the side showing both the weak Emperor and the player's position of hidden influence"
4. WHEN Revolutionary Path THEN background SHALL be "A tense imperial court with overturned furniture and scattered scrolls, the Emperor stands defiantly but isolated, dramatic lighting with harsh shadows, red banners torn or fallen, camera angle showing confrontation between equals"
5. WHEN Survivor Path THEN background SHALL be "A foreboding imperial judgment hall with the Emperor silhouetted in shadow on his throne high above, cold stone architecture with minimal decoration, harsh spotlights creating dramatic shadows, camera angle from below as if the player is kneeling or standing accused"
6. WHEN audience completes THEN state machine SHALL send outcome to parent game machine
7. WHEN outcome is 'victory' THEN parent SHALL transition to victory game_over state
8. WHEN outcome is 'execution' THEN parent SHALL transition to defeat game_over state  
9. WHEN outcome is 'failure' THEN parent SHALL return to normal gameplay with demotion and influence loss

### Requirement 12.1: AI Question Generation System

**User Story:** As a player, I want the Emperor to ask me contextual questions based on my political situation and chosen victory path, so that each audience feels unique and relevant to my specific game state.

#### Acceptance Criteria

1. WHEN generating questions THEN AI SHALL receive path-specific context data
2. WHEN Revolutionary Path THEN context SHALL include: influence, ambition, loyalty, fear, politicalSkill, faction member counts, suspiciousCharacters count, characterType (minister bias)
3. WHEN Traditional Path THEN context SHALL include: influence, loyalty, perceivedLoyalty, perceivedThreat, suspiciousCharacters count, faction member counts, characterType (prince bias)
4. WHEN Shadow Ruler Path THEN context SHALL include: influence, perceivedLoyalty, politicalSkill, faction member counts, characterType (concubine bias)
5. WHEN Survivor Path THEN context SHALL include: perceivedLoyalty, perceivedThreat
6. WHEN questions are generated THEN AI SHALL create exactly 3 questions with 3 multiple choice answers each
7. WHEN questions are generated THEN correct answers SHALL always favor Emperor's perspective and interests
8. WHEN Revolutionary Path THEN questions SHALL require keeping Emperor calm while allies prepare (suspicious answers trigger execution)

### Requirement 12.2: Answer Validation and Outcome System

**User Story:** As a player, I want my answers to be judged fairly based on both correctness and my political context, so that my success depends on both knowledge and my character's political development.

#### Acceptance Criteria

1. WHEN player submits 3 answers THEN AI SHALL judge outcome using full game context
2. WHEN judging Revolutionary Path THEN AI SHALL weight: high influence (+), high ambition (+), low loyalty (+), low fear (+), high politicalSkill (+), more faction members (+), low suspiciousCharacters (+), minister characterType (+)
3. WHEN judging Traditional Path THEN AI SHALL weight: high influence (+), high loyalty (+), high perceivedLoyalty (+), low perceivedThreat (+), low suspiciousCharacters (+), more faction members (+), prince characterType (+)
4. WHEN judging Shadow Ruler Path THEN AI SHALL weight: high influence (+), high perceivedLoyalty (+), high politicalSkill (+), more faction members (+), concubine characterType (+)
5. WHEN judging Survivor Path THEN AI SHALL weight: high perceivedLoyalty (+), low perceivedThreat (+)
6. WHEN outcome is determined THEN AI SHALL provide dramatic Emperor message explaining decision
7. WHEN outcome is 'failure' THEN player SHALL be demoted and lose 0.4 influence
8. WHEN outcome is 'victory' THEN game SHALL end with path-specific victory screen
9. WHEN outcome is 'execution' THEN game SHALL end with defeat screen

### Requirement 13.1: Victory Path Integration

**User Story:** As a player, I want each victory path to feel distinct and meaningful, with different requirements and outcomes that reflect the political strategy I've pursued.

#### Acceptance Criteria

1. WHEN Traditional Path succeeds THEN victory message SHALL reference legitimate succession and imperial approval
2. WHEN Shadow Ruler Path succeeds THEN victory message SHALL reference controlling the empire from behind the scenes
3. WHEN Revolutionary Path succeeds THEN victory message SHALL reference overthrowing the old order and seizing power
4. WHEN Survivor Path succeeds THEN victory message SHALL reference escaping execution and living to fight another day
5. WHEN any path fails THEN player SHALL return to normal gameplay with penalties
6. WHEN player attempts same victory path again THEN event SHALL not trigger (one attempt per game)
7. WHEN player qualifies for multiple paths THEN only faction-based path SHALL trigger (faction membership takes precedence)

### Requirement 13.2: Context Data Types

**User Story:** As a developer, I want strongly typed context data for each victory path, so that the AI receives consistent and relevant information for generating appropriate content.

#### Acceptance Criteria

1. WHEN Revolutionary Path triggers THEN RevolutionaryContext SHALL include: influence: number, ambition: number, loyalty: number, fear: number, politicalSkill: number, factionMemberCounts: Record<string, number>, suspiciousCharacters: number, characterType: string
2. WHEN Traditional Path triggers THEN TraditionalContext SHALL include: influence: number, loyalty: number, perceivedLoyalty: number, perceivedThreat: number, suspiciousCharacters: number, factionMemberCounts: Record<string, number>, characterType: string
3. WHEN Shadow Ruler Path triggers THEN ShadowRulerContext SHALL include: influence: number, perceivedLoyalty: number, politicalSkill: number, factionMemberCounts: Record<string, number>, characterType: string
4. WHEN Survivor Path triggers THEN SurvivorContext SHALL include: perceivedLoyalty: number, perceivedThreat: number
5. WHEN context is passed to AI THEN all numeric values SHALL be normalized between 0-1
6. WHEN context is passed to AI THEN characterType SHALL match player's chosen path for bias calculation

## Implementation Priority

**Phase 1 (Core System):**
- Event trigger system and offer UI
- Basic emperor audience state machine
- Context data type definitions

**Phase 2 (AI Integration):**
- AI question generation with path-specific prompts
- Answer validation and outcome determination
- Emperor personality and response system

**Phase 3 (Polish):**
- Cinematic background images
- Victory path specific messaging
- Integration testing and balancing

## Technical Considerations

- AI prompts must be carefully crafted to ensure consistent Emperor personality
- Context data should be sanitized and validated before passing to AI
- State machine must handle AI failures gracefully with fallback outcomes
- Background images should be optimized for performance
- Victory conditions must be clearly communicated to players

## Success Metrics

- Players should feel that emperor audiences are climactic and meaningful
- Each victory path should feel distinct and achievable through different strategies
- AI-generated questions should feel contextual and appropriate
- Success/failure should correlate with player's political development and choices