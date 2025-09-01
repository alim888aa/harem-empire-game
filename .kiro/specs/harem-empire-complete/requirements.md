# Harem Empire - Game Specification

Political intrigue game where players navigate imperial court relationships using vector-based character personalities to seize power.

## Core Features ✅ IMPLEMENTED

### 1. Character Vector System ✅
- Characters have personality vectors: ambition, loyalty, fear, influence, suspicion
- Characters have relationship vectors with player: trust, loyalty, fear, dependence
- Vectors stay within 0-1 bounds and influence character responses
- Detailed stats visible when character trust ≥ 0.5

### 2. Player Character System ✅
- Player has personality vectors that evolve based on choices
- Different starting paths (Prince/Minister/Concubine) have different vectors
- Player reputation system tracks perceived loyalty, threat, skill, trustworthiness
- Clickable stats display in header

### 3. Dynamic Relationship System ✅
- Relationship building with compound growth bonuses
- Support calculated from relationship vectors (capped at 100)
- Player type affects relationship building speed (Prince fastest, Concubine slowest)
- Trust-weighted support formula

### 4. Message Choice System ✅
- 4 message options when giving gifts
- Character responses based on personality compatibility
- Message/personality matching affects relationship gains
- Contextual character responses

## Sprint 2: Risk/Reward Systems

### 5. Enhanced Suspicion System 🔄 PARTIAL
- ✅ Suspicious messages increase character suspicion
- ✅ High suspicion triggers execution
- ❌ Need: Suspicion decay from loyal actions
- ❌ Need: Different thresholds by character type

### 6. Influence-Gated Actions ❌
- Disable "Spit in Face" for high influence characters (>0.6)
- Restrict threatening messages for very high influence (>0.8)
- Some characters refuse interactions if player influence too low
- Show explanatory messages for restricted actions

### 7. Gift Reward System ❌
- Characters at 100 support give gifts to player
- Side characters give 5 gifts, minor characters give 1
- Notification system for received gifts
- Increases character dependence 

## Sprint 3: Dynamic Character System

### 8. Random Character Assignment ❌
- 6 random characters per game (1-2 side, 4-5 minor)
- Weighted by player path (concubines meet concubines, etc.)
- 2 characters from outside player's circle for variety
- New character set each restart

### 9. Faction Auto-Formation ❌
- Characters form factions based on similar vectors
- Rebel faction: high ambition + low loyalty
- Imperial faction: high loyalty + high influence
- Joining faction: +10 support with members, -50 support with opponents

### 10. Weighted Character Assignment ❌
- Player path influences character pool
- Thematic character matching with diversity maintained

## Future Concepts 📋

### 11. Character-to-Character Relationships 📋
- Characters have relationships with each other
- Ally/rival system affects player interactions
- Network effects from player actions

### 12. Vector-Based Event Generation 📋
- Events emerge from character vector states
- Conspiracy, investigation, crisis events
- Multiple character involvement

### 13. AI-Generated Content 📋
- AI generates message options and responses
- Character vectors inform AI prompts
- Pre-generation for performance

### 14. Victory Condition Variants 📋
- Multiple win paths by character type
- Traditional Emperor, Shadow Ruler, Revolutionary, Survivor paths
- Path-specific endings

### 15. Advanced UI & Analytics 📋
- Relationship network visualization
- Predictive modeling for actions
- Political climate analysis
- Historical relationship tracking

### 16. Technical Improvements 📋
- Performance optimization
- Save/load system
- Better architecture for scaling

## Status Legend
- ✅ IMPLEMENTED
- 🔄 PARTIAL  
- ❌ PLANNED
- 📋 CONCEPT

My ideas: 
- When the user's influence is high (above 0.6), every character's fear vector increases exponentially (unless in the same faction)
- When the user gifts a gift to an ambitious character, increase suspicion in loyal characters
- We need a vector for dislike and characters that are similar to the user should have a little bit of dislike
- The promotional character that the user is aiming to take over for should have higher dislike