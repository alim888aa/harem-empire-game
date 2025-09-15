# Requirements Document

## Introduction

This document outlines comprehensive improvements for the Harem Empire political intrigue game. The game currently exists in two implementations: a legacy JavaScript version with advanced vector systems and a modern React/TypeScript version using XState for state management. This spec focuses on consolidating the best features from both versions while adding new strategic depth, improved user experience, and enhanced political mechanics.

The improvements will maintain the core game loop of character relationship building, political maneuvering, and path-based progression while adding sophisticated risk/reward systems, dynamic content generation, and emergent political storytelling.

## Requirements

### Requirement 1: Unified Game Architecture

**User Story:** As a developer, I want a single, cohesive game implementation that combines the best features from both versions, so that maintenance is simplified and all advanced features work together seamlessly.

#### Acceptance Criteria

1. WHEN game initializes THEN it SHALL use the React/TypeScript implementation as the primary codebase
2. WHEN game starts THEN all vector systems from the legacy version SHALL be integrated into the state machine
3. WHEN character interactions occur THEN they SHALL use the advanced message system with personality-based responses
4. WHEN game state changes THEN XState SHALL manage all transitions while preserving vector calculations
5. WHEN player performs actions THEN both relationship vectors and game state SHALL update consistently

### Requirement 2: Enhanced Character Interaction System

**User Story:** As a player, I want rich, contextual interactions with characters that reflect their personalities and our relationship history, so that every conversation feels meaningful and strategic.

#### Acceptance Criteria

1. WHEN interacting with character THEN 4 message options SHALL be available based on personality vectors
2. WHEN character trust >= 0.5 THEN detailed character stats SHALL be visible including relationship and personality vectors
3. WHEN message is selected THEN character response SHALL be generated based on personality compatibility
4. WHEN character responds THEN response SHALL include personality-appropriate dialogue and vector changes
5. WHEN relationship vectors change THEN support level SHALL be recalculated from relationship components
6. WHEN character has high fear (>0.7) THEN they SHALL refuse certain interaction types
7. WHEN player influence exceeds character influence by 0.3+ THEN character SHALL show deference in responses

### Requirement 3: Advanced Suspicion and Risk Management

**User Story:** As a player, I want suspicion to create meaningful political risk that varies by character type and relationship, so that I must carefully balance ambition with survival.

#### Acceptance Criteria

1. WHEN character type is 'major' THEN suspicion threshold SHALL be 0.5
2. WHEN character type is 'side' THEN suspicion threshold SHALL be 0.7  
3. WHEN character type is 'minor' THEN suspicion threshold SHALL be 0.9
4. WHEN character suspicion exceeds threshold THEN they SHALL be marked as suspicious
5. WHEN suspicious character count reaches execution limit THEN game SHALL end in defeat
6. WHEN player type is 'concubine' THEN execution limit SHALL be 1 suspicious character
7. WHEN player type is 'minister' THEN execution limit SHALL be 3 suspicious characters
8. WHEN player type is 'prince' THEN execution limit SHALL be 5 suspicious characters
9. WHEN player performs loyal actions THEN characters with loyalty > 0.5 SHALL lose 0.1 suspicion
10. WHEN character has high trust (>0.8) THEN their suspicion threshold SHALL increase by 0.1

### Requirement 4: Dynamic Influence and Power Mechanics

**User Story:** As a player, I want my growing influence to create realistic political consequences including fear, respect, and access restrictions, so that power progression feels authentic and strategic.

#### Acceptance Criteria

1. WHEN player gets promoted THEN influence SHALL increase by 0.4 (maximum 1.0)
2. WHEN player gets promoted THEN all characters SHALL gain 0.3 fear of player
3. WHEN player influence > 0.6 THEN character influence > 0.6 SHALL disable "Spit in Face" action
4. WHEN player influence > 0.8 THEN threatening message options SHALL be disabled for high-influence characters
5. WHEN player influence < character influence - 0.3 THEN character SHALL refuse all interactions
6. WHEN action is disabled THEN tooltip SHALL explain the influence requirement
7. WHEN player influence > 0.8 THEN notification SHALL display "Your growing influence strikes fear into courtiers"
8. WHEN character fear increases due to influence THEN they SHALL make fearful comments in responses

### Requirement 5: Faction System and Political Alliances

**User Story:** As a player, I want characters to form political factions based on their beliefs and relationships, so that I can navigate complex alliance networks and factional politics.

#### Acceptance Criteria

1. WHEN game initializes THEN characters SHALL be assigned to factions based on personality vectors
2. WHEN character has ambition > 0.7 AND loyalty < 0.5 THEN they SHALL join Rebel faction
3. WHEN character has loyalty > 0.7 AND influence > 0.5 THEN they SHALL join Imperial faction
4. WHEN character has fear > 0.5 AND loyalty > 0.5 THEN they SHALL join Loyalist faction
5. WHEN character doesn't meet faction criteria THEN they SHALL remain Neutral
6. WHEN player gains support with faction member THEN all faction members SHALL gain 5 support
7. WHEN player gains support with faction member THEN opposing faction members SHALL lose 5 support
8. WHEN faction has 3+ members at 60+ support THEN faction SHALL offer player membership
9. WHEN player joins faction THEN faction bonuses SHALL activate for relationship building
10. WHEN player betrays faction THEN all faction members SHALL gain 0.3 suspicion and lose 0.4 trust

### Requirement 6: Gift Economy and Reward System

**User Story:** As a player, I want a balanced gift economy where high-relationship characters provide rewards, so that relationship investment has tangible benefits beyond support points.

#### Acceptance Criteria

1. WHEN character support reaches 100 THEN character SHALL offer to give gifts to player
2. WHEN character relationship vector 'dependenceOnPlayer' >= 0.8 THEN character SHALL give gifts
3. WHEN 'major' character gives gifts THEN player SHALL receive 10 gifts
4. WHEN 'side' character gives gifts THEN player SHALL receive 5 gifts
5. WHEN 'minor' character gives gifts THEN player SHALL receive 2 gifts
6. WHEN gifts are received THEN notification SHALL display character name and gift amount
7. WHEN character gives gifts THEN they SHALL NOT give gifts again for 3 seasons
8. WHEN character has given gifts recently THEN UI SHALL show "Recently Generous" status
9. WHEN player has maximum gifts (50+) THEN characters SHALL comment on player's wealth

### Requirement 7: Random Character Assignment and Replayability

**User Story:** As a player, I want each playthrough to feature different character combinations weighted by my chosen path, so that every game feels unique while maintaining thematic coherence.

#### Acceptance Criteria

1. WHEN game starts THEN 6-8 characters SHALL be randomly selected from character pool
2. WHEN player chooses 'prince' THEN 60% of characters SHALL be princes/ministers, 40% others
3. WHEN player chooses 'minister' THEN 60% of characters SHALL be ministers/princes, 40% others
4. WHEN player chooses 'concubine' THEN 60% of characters SHALL be concubines/maids, 40% others
5. WHEN characters are selected THEN at least 1 major character SHALL always be included
6. WHEN characters are selected THEN at least 2 SHALL be from outside player's social circle
7. WHEN game restarts THEN completely new character set SHALL be generated
8. WHEN character pool is insufficient THEN game SHALL use fallback character generation

### Requirement 8: Cross-Character Relationship Effects

**User Story:** As a player, I want my actions with one character to affect others based on their relationships and factions, so that I must consider the broader political network in my decisions.

#### Acceptance Criteria

1. WHEN player gives ambitious message to character with ambition >= 0.7 THEN same-faction characters SHALL gain 0.05 suspicion
2. WHEN player spits in character's face THEN same-faction characters SHALL gain 0.1 suspicion
3. WHEN player performs loyal action THEN Imperial faction members SHALL lose 0.05 suspicion
4. WHEN player gains influence > 0.6 THEN non-allied characters SHALL gain fear based on influence level
5. WHEN character witnesses player's cruel action THEN their fear vector SHALL increase by 0.1
6. WHEN character has high trust with player (>0.8) THEN they SHALL defend player to others, reducing suspicion spread by 50%

### Requirement 9: Enhanced Emperor Encounter System

**User Story:** As a player, I want emperor encounters to reflect my political reputation and relationships, so that my actions throughout the game affect these crucial moments.

#### Acceptance Criteria

1. WHEN emperor encounter occurs THEN player reputation SHALL influence emperor's initial attitude
2. WHEN player has high perceivedLoyalty (>0.8) AND low gifts THEN emperor SHALL show understanding
3. WHEN player has high perceivedThreat (>0.6) THEN emperor SHALL be more suspicious and demanding
4. WHEN player has faction support THEN faction members SHALL influence emperor's decision
5. WHEN player refuses emperor THEN consequences SHALL vary based on political position and support
6. WHEN emperor encounter ends THEN all characters SHALL react based on the outcome and their personalities

### Requirement 10: Advanced UI and Information Systems

**User Story:** As a player, I want clear, informative UI that helps me understand complex political relationships and make strategic decisions, so that I can engage with the game's depth without confusion.

#### Acceptance Criteria

1. WHEN viewing character details THEN faction membership SHALL be clearly displayed with faction colors
2. WHEN hovering over disabled actions THEN tooltip SHALL explain influence or relationship requirements
3. WHEN character stats are shown THEN suspicion SHALL be color-coded (green <0.3, yellow 0.3-0.6, red >0.6)
4. WHEN faction panel is open THEN all faction members and their relationships SHALL be visible
5. WHEN player reputation changes THEN subtle UI indicators SHALL show the change
6. WHEN character gives gifts THEN animation SHALL show gift transfer with appropriate messaging
7. WHEN suspicion is high THEN warning indicators SHALL appear on character portraits
8. WHEN player influence changes THEN influence meter SHALL update with visual feedback

### Requirement 11: Seasonal Progression and Character Evolution

**User Story:** As a player, I want characters and political situations to evolve over time, so that long-term strategy and relationship building create emergent storytelling.

#### Acceptance Criteria

1. WHEN season advances THEN character vectors SHALL have small random variations (±0.02)
2. WHEN character has been at high support (>80) for 3+ seasons THEN their loyalty vector SHALL increase by 0.05
3. WHEN character witnesses political upheaval THEN their fear and suspicion vectors SHALL increase
4. WHEN character is isolated (no faction, low relationships) THEN their vectors SHALL drift toward neutral
5. WHEN major events occur THEN all characters SHALL have personality adjustments based on their nature
6. WHEN player maintains consistent behavior THEN characters SHALL comment on player's reputation
7. WHEN seasons progress THEN new political events SHALL become available based on game state

### Requirement 12: Performance and Technical Excellence

**User Story:** As a developer, I want the game to perform smoothly with clean, maintainable code that follows established patterns, so that future development and debugging are efficient.

#### Acceptance Criteria

1. WHEN game runs THEN frame rate SHALL remain stable during all interactions
2. WHEN state changes occur THEN XState transitions SHALL complete within 100ms
3. WHEN vector calculations run THEN they SHALL not block the UI thread
4. WHEN game saves state THEN all vectors and relationships SHALL be preserved accurately
5. WHEN errors occur THEN they SHALL be logged with sufficient context for debugging
6. WHEN code is written THEN it SHALL follow existing TypeScript patterns and state machine architecture
7. WHEN tests are needed THEN they SHALL be UI-based manual tests as specified in development guidelines

## Implementation Priority

**Phase 1 (Core Systems):**
- Unified game architecture with integrated vector systems
- Enhanced character interaction system with personality-based responses
- Advanced suspicion and risk management

**Phase 2 (Political Mechanics):**
- Dynamic influence and power mechanics
- Faction system and political alliances
- Cross-character relationship effects

**Phase 3 (Economy and Progression):**
- Gift economy and reward system
- Random character assignment system
- Enhanced emperor encounter system

**Phase 4 (Polish and Advanced Features):**
- Advanced UI and information systems
- Seasonal progression and character evolution
- Performance optimization and technical excellence

## Success Metrics

- Players should experience unique, emergent political stories in each playthrough
- Character relationships should feel meaningful and consequential
- Political maneuvering should require strategic thinking about faction dynamics
- The game should maintain performance while handling complex relationship calculations
- UI should clearly communicate complex political information without overwhelming players