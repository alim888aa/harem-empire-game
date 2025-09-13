# Requirements Document

## Introduction

This document outlines the requirements for advanced political intrigue mechanics that build upon the existing Harem Empire core game system. The enhancements focus on creating sophisticated risk/reward systems, dynamic character assignment, faction mechanics, and emergent political dynamics to increase strategic depth and replayability.

The core game foundation is already implemented with character vector systems, player paths, relationship building, message choices, and basic suspicion mechanics. These advanced features will extend the existing systems without breaking current functionality.

## Requirements

### Requirement 0.1: Character Stats Display System

**User Story:** As a player, I want to see detailed character statistics in a clear, formatted display, so that I can make informed decisions about my political relationships and understand character personalities.

#### Acceptance Criteria

1. WHEN viewing character details THEN character stats display SHALL show relationship section with Trust, Loyalty, Fear, and Dependence percentages
2. WHEN viewing character details THEN character stats display SHALL show personality section with Ambition, Empire Loyalty, and Influence percentages
3. WHEN viewing character details THEN suspicion SHALL be displayed with color coding based on suspicion level (getSuspicionColor function)
4. WHEN character stats are displayed THEN formatting SHALL include proper styling with font-size 11px, color #444, border-top, and padding
5. WHEN stats display is shown THEN it SHALL only appear when canShowStats condition is true

### Requirement 0.2: Player Vector and Reputation System

**User Story:** As a player, I want my actions to affect my character's personality and reputation stats, so that I experience character development and face consequences for my political choices.

#### Acceptance Criteria

1. WHEN player performs ambitious actions THEN player ambition vector SHALL increase by 0.03 and perceivedThreat reputation SHALL increase by 0.05
2. WHEN player performs loyal actions THEN player loyalty vector SHALL increase by 0.03 and perceivedLoyalty reputation SHALL increase by 0.02
3. WHEN player performs cautious actions THEN player fear vector SHALL increase by 0.02 and trustworthiness reputation SHALL increase by 0.01
4. WHEN player successfully manipulates character with trust > 0.8 THEN politicalSkill reputation SHALL increase by 0.01
5. WHEN emperor encounter occurs AND player has < 10 gifts AND perceivedLoyalty > 0.8 THEN execution SHALL be avoided with loyalty message

### Requirement 0.3: Influence-Based Fear and Promotion Effects

**User Story:** As a player, I want my growing influence to create fear in other characters and face realistic consequences when gaining promotions, so that I experience the political dynamics of rising power.

#### Acceptance Criteria

1. WHEN player has influence > 0 at game start THEN initial fear SHALL be applied to all living non-emperor characters by 0.5 * (influence/1.0)
2. WHEN player gets promoted THEN influence SHALL increase by 0.4 (up to maximum of 1.0)
3. WHEN player gets promoted THEN all side characters SHALL lose 0.2 trust and 0.1 loyalty toward player
4. WHEN player gets promoted THEN all living non-emperor characters SHALL gain 0.3 fear of player
5. WHEN player influence > 0.6 THEN fear SHALL increase each season by 0.5 * ((influence - 0.6) / 0.4) for all living non-emperor characters
6. WHEN player influence > 0.8 THEN notification SHALL display "Your growing influence strikes fear into the hearts of courtiers..."
7. WHEN calculating relationship bonuses THEN trust compound bonus SHALL return 1.8x for trust >= 0.8, 1.4x for >= 0.6, 1.2x for >= 0.4, 1.0x otherwise

## Requirements
### Requirement 1: Enhanced Suspicion System

**User Story:** As a player, I want suspicion to be a nuanced risk system where loyal actions can reduce suspicion and different characters have different tolerance levels, so that I can strategically manage political risk through careful relationship building.

#### Acceptance Criteria

1. WHEN player performs loyal actions THEN character suspicion SHALL decrease by 0.1-0.2
2. WHEN character type is 'major' THEN suspicion threshold SHALL be 0.5 (easier to trigger)
3. WHEN character type is 'side' THEN suspicion threshold SHALL be 0.7 (standard)
4. WHEN character type is 'minor' THEN suspicion threshold SHALL be 0.9 (more forgiving)
5. WHEN player gives loyal message THEN target character suspicion SHALL decrease
6. WHEN player gives loyal message to character with loyalty > 0.6 THEN other loyal characters' suspicion SHALL decrease by 0.05

### Requirement 2: Influence-Gated Actions

**User Story:** As a player, I want my actions to be restricted based on character influence levels, so that I must build my own power before challenging high-status characters, creating strategic depth around political hierarchy.

#### Acceptance Criteria

1. WHEN character influence > 0.6 THEN "Spit in Face" action SHALL be disabled
2. WHEN character influence > 0.8 THEN threatening message options SHALL be disabled
3. WHEN player influence < character influence - 0.3 THEN character SHALL refuse all interactions
4. WHEN action is disabled THEN explanatory tooltip SHALL show reason
5. WHEN character refuses interaction THEN message SHALL explain "They consider you beneath their notice"
6. WHEN player gains influence THEN previously locked interactions SHALL become available

### Requirement 3: Gift Reward System

**User Story:** As a player, I want characters at maximum support to reward me with gifts, so that I have incentive to fully develop relationships and receive tangible benefits for political investment.

#### Acceptance Criteria

1. WHEN character support reaches 100 THEN character SHALL give gifts to player
2. WHEN 'major' character gives gifts THEN player SHALL receive 10 gifts
3. WHEN 'side' character gives gifts THEN player SHALL receive 5 gifts  
4. WHEN 'minor' character gives gifts THEN player SHALL receive 1 gift
5. WHEN gifts are received THEN notification SHALL display with character name and amount
6. WHEN character gives gifts THEN character dependence vector SHALL increase by 0.2
7. WHEN character has given gifts THEN they SHALL NOT give gifts again for 3 seasons

### Requirement 4: Cross-Character Suspicion Effects

**User Story:** As a player, I want my actions with one character to affect others' suspicion, so that I must consider the broader political implications of my choices, creating network effects and strategic complexity.

#### Acceptance Criteria

1. WHEN player gives ambitious message to character with ambition > 0.7 THEN all characters with loyalty > 0.6 SHALL gain 0.1 suspicion
2. WHEN player spits in face of character THEN all characters of same type SHALL gain 0.05 suspicion
3. WHEN player gains influence > 0.6 THEN all characters not in same faction SHALL gain fear exponentially (fear * 1.2)
4. WHEN character becomes suspicious THEN other characters SHALL be notified and gain 0.02 suspicion
5. WHEN player performs loyal action THEN characters with loyalty > 0.5 SHALL lose 0.03 suspicion

### Requirement 5: Random Character Assignment

**User Story:** As a player, I want each game to have a different set of characters for replayability, so that I experience varied political dynamics while maintaining thematic consistency based on my chosen path.

#### Acceptance Criteria

1. WHEN game starts THEN 6-8 characters SHALL be randomly selected from character pool
2. WHEN player chooses 'prince' THEN 60% of characters SHALL be princes/ministers, 40% others
3. WHEN player chooses 'minister' THEN 60% of characters SHALL be ministers/officials, 40% others  
4. WHEN player chooses 'concubine' THEN 60% of characters SHALL be concubines/court ladies, 40% others
5. WHEN characters are selected THEN at least 2 SHALL be from outside player's circle for variety
6. WHEN game restarts THEN completely new character set SHALL be generated
7. WHEN character pool is selected THEN major characters (Crown Prince, Prime Minister, Empress Consort) SHALL always be included

### 6. Faction Auto-Formation

**User Story:** As a player, I want characters to form factions based on their personality vectors, creating political alliances and rivalries.

#### Acceptance Criteria
1. WHEN game initializes THEN characters SHALL be assigned to factions based on vectors
2. WHEN character has ambition > 0.7 AND loyalty < 0.4 THEN character SHALL join Rebel faction
3. WHEN character has loyalty > 0.7 AND influence > 0.5 THEN character SHALL join Imperial faction
4. WHEN character has fear > 0.6 AND loyalty > 0.5 THEN character SHALL join Loyalist faction
5. WHEN character doesn't fit faction criteria THEN character SHALL remain Independent
6. WHEN player gains support with faction member THEN all faction members SHALL gain 5 support
7. WHEN player gains support with faction member THEN opposing faction members SHALL lose 10 support
8. WHEN faction has 3+ members at 80+ support THEN faction SHALL offer player membership
9. WHEN player joins faction THEN faction bonus effects SHALL activate

### 7. Character Dislike Vector

**User Story:** As a player, I want characters to have natural dislikes based on similarity and competition, adding realistic interpersonal dynamics.

#### Acceptance Criteria
1. WHEN character vectors are similar to player vectors (difference < 0.3) THEN character SHALL have dislike 0.2-0.4
2. WHEN character is the promotion target for player path THEN character SHALL have dislike 0.5-0.7
3. WHEN character has high dislike THEN relationship building SHALL be 50% slower
4. WHEN character dislike > 0.6 THEN character SHALL occasionally make hostile comments
5. WHEN player performs actions matching character's disliked traits THEN dislike SHALL increase by 0.1
6. WHEN player consistently acts against character's disliked traits THEN dislike SHALL decrease by 0.05 per season

### 8. Influence-Based Fear Cascade

**User Story:** As a player, I want high influence to create fear in other characters, making them more cautious but potentially more hostile.

#### Acceptance Criteria
1. WHEN player influence > 0.6 THEN all non-faction characters' fear SHALL increase by (influence - 0.6) * 0.5 each season
2. WHEN character fear > 0.8 THEN character SHALL refuse ambitious message options
3. WHEN character fear > 0.9 THEN character SHALL only accept cautious and loyal messages
4. WHEN character fear increases THEN character SHALL make fearful comments in responses
5. WHEN player influence decreases THEN character fear SHALL slowly decay by 0.1 per season
6. WHEN character is in same faction as player THEN influence-based fear SHALL NOT apply

## Sprint 4: Advanced Political Dynamics

### 9. Conspiracy Detection System

**User Story:** As a player, I want the game to detect when I'm building a conspiracy and have other characters react accordingly.

#### Acceptance Criteria
1. WHEN player has 3+ characters with ambition > 0.7 at 80+ support THEN conspiracy SHALL be detected
2. WHEN conspiracy is detected THEN loyal characters SHALL gain 0.2 suspicion per season
3. WHEN conspiracy is detected THEN Imperial faction members SHALL become hostile
4. WHEN conspiracy grows to 5+ members THEN random events SHALL trigger investigations
5. WHEN investigation event occurs THEN player SHALL face choice to abandon conspiracy or risk execution

### 10. Seasonal Vector Evolution

**User Story:** As a player, I want character personalities to evolve over time based on game events and relationships.

#### Acceptance Criteria
1. WHEN character has high support with player for 3+ seasons THEN loyalty vector SHALL increase by 0.05
2. WHEN character witnesses executions THEN fear vector SHALL increase by 0.1
3. WHEN character is in successful faction THEN ambition vector SHALL increase by 0.03
4. WHEN character is isolated (no faction, low support) THEN all vectors SHALL slowly drift toward neutral
5. WHEN major political events occur THEN all characters SHALL have vector adjustments based on personality

## Implementation Priority

**Phase 1 (High Impact, Low Complexity):**
- Enhanced suspicion system with decay and thresholds
- Influence-gated actions with UI feedback
- Cross-character suspicion effects

**Phase 2 (Medium Complexity):**
- Gift reward system with notifications
- Character dislike vector implementation
- Influence-based fear cascade

**Phase 3 (High Complexity):**
- Random character assignment system
- Faction auto-formation with political effects
- Conspiracy detection mechanics

**Phase 4 (Advanced Features):**
- Seasonal vector evolution
- Advanced political event system

## Technical Considerations

- All new vectors must stay within 0-1 bounds
- Faction assignments should be recalculated when character vectors change significantly
- Random character selection needs to maintain game balance
- UI needs to clearly communicate faction memberships and influence restrictions
- Performance impact of cross-character effects needs monitoring

## Success Metrics

- Players should feel that character relationships have meaningful consequences
- Political maneuvering should feel strategic rather than random
- Each playthrough should feel unique due to random character assignment
- Faction dynamics should create emergent storytelling opportunities