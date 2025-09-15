# Implementation Plan

- [x] 0.1 Character Stats Display System
  - Create character stats display component that shows relationship and personality statistics
  - Implement getSuspicionColor function for color-coding suspicion levels based on severity
  - Add formatted display sections for relationship stats (Trust, Loyalty, Fear, Dependence percentages)
  - Add formatted display sections for personality stats (Ambition, Empire Loyalty, Influence, Suspicion percentages)
  - Apply proper CSS styling with font-size 11px, color #444, border-top, and padding
  - Add conditional display logic that only shows stats when canShowStats is true
  - **Expected Gameplay**: When you click on characters, you'll see detailed formatted statistics showing their relationship with you and their personality traits, with suspicion highlighted in warning colors.
  - **Expected UI**: Character detail panels should show two sections - Relationship and Personality - with percentage values and proper styling. Suspicion should be color-coded based on danger level.
  - _Requirements: 0.1.1, 0.1.2, 0.1.3, 0.1.4, 0.1.5_

- [ ] 0.2 Player Vector and Reputation System
  - Implement updatePlayerVector function that modifies player stats based on action types
  - Add player ambition increase (+0.03) and perceivedThreat increase (+0.05) for ambitious actions
  - Add player loyalty increase (+0.03) and perceivedLoyalty increase (+0.02) for loyal actions
  - Add player fear increase (+0.02) and trustworthiness increase (+0.01) for cautious actions
  - Implement politicalSkill increase (+0.01) when successfully manipulating high-trust characters
  - Update giveEmperorGifts function to allow loyalty bypass when perceivedLoyalty > 0.8
  - **Expected Gameplay**: Your actions will shape your character's personality and reputation. Ambitious actions make you more threatening, loyal actions improve your reputation, and successful manipulation increases your political skill.
  - **Expected UI**: Player stats should visibly change after performing different actions. Emperor encounters should show loyalty bypass option when your reputation is high enough.
  - _Requirements: 0.2.1, 0.2.2, 0.2.3, 0.2.4, 0.2.5_

- [x] 0.3 Influence-Based Fear and Promotion Effects
  - Implement applyInitialInfluenceFear function for game start fear application based on starting influence
  - Create promotion effects that increase player influence by 0.4 (capped at 1.0)
  - Add side character penalties on promotion (-0.2 trust, -0.1 loyalty to player)
  - Implement fear increase (+0.3) for all living non-emperor characters on promotion
  - Create applyInfluenceFear function for ongoing fear increases when player influence > 0.6
  - Add influence-based fear calculation: 0.5 * ((influence - 0.6) / 0.4) per season
  - Implement getTrustCompoundBonus function with trust-based multipliers (1.8x, 1.4x, 1.2x, 1.0x)
  - Add notification system for high influence (> 0.8): "Your growing influence strikes fear..." - reuse existing promotion notification or just add the message to that component
  - **Expected Gameplay**: As you gain influence and promotions, other characters will become increasingly fearful of you. High-trust relationships will develop faster due to compound bonuses.
  - **Expected UI**: Character fear levels should increase visibly as your influence grows. Promotions should show immediate stat changes across all characters. High influence should trigger fear notifications.
  - _Requirements: 0.3.1, 0.3.2, 0.3.3, 0.3.4, 0.3.5, 0.3.6, 0.3.7_

- [x] 1. Enhanced Suspicion System





 	- Add a suspicionThreshold property to the Character input/context and set it when spawning characters (major=0.5, side=0.7, minor=0.9).

	- In character-machine.ts: use the character’s suspicionThreshold in the guard that detects suspicious characters; when threshold is reached sendParent an event (CHARACTER_IS_SUSPICIOUS) with the character name and type.

	- In game-machine.ts: replace the current CHARACTER_IS_SUSPICIOUS handler so it:
		- adds event.name to context.suspiciousCharacters if not already present (keep the list unique), and

		- after adding, checks the player-role execution mapping { concubine:1, minister:3, prince:5 } and, if reached, transitions to #gameMachine.game_over and sets gameEndReason: 'defeat'.

	- Ensure context.suspiciousCharacters is maintained as the authoritative list of characters that have crossed their thresholds.


  - **Expected Gameplay**: Characters have visible suspicion thresholds. When a character reaches its threshold they appear in the game's suspiciousCharacters list. When the list size meets the player-role execution threshold the game ends in defeat. SPIT_IN_FACE raises suspicion on the target.

  - **Expected UI**: Show each character's suspicion and suspicionThreshold; show the game's suspiciousCharacters list; surface clear warnings when characters enter the suspiciousCharacters list and when the list approaches the player-role execution threshold.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Influence-Gated Actions








  - Implement action validation system that checks character influence vs player influence
  - Add UI logic to disable "Spit in Face" action when character influence > 0.6
  - Add UI logic to disable threatening message options when character influence > 0.8
  - Create tooltip system showing explanatory messages for disabled actions
  - Implement character interaction refusal when player influence < character influence - 0.3
  - Add dynamic action availability updates as player influence changes
  - **Expected Gameplay**: High-influence characters will be protected from certain hostile actions. Very powerful characters may refuse to interact with you entirely if your influence is too low.
  - **Expected UI**: Action buttons will be grayed out with tooltips explaining why (e.g., "They are too powerful to insult directly"). Characters may display "They consider you beneath their notice" messages.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Gift Reward System







  - Create gift calculation logic based on character type (15 gifts for major, 10 for side, 5 for minor)
  - Implement gift notification system that displays when characters give gifts at 100 support and/or 100 loveForPlayer
  - Add gift cooldown mechanism preventing characters from giving gifts again for 3 seasons
  - Add UI indicators showing characters in gift cooldown period
  - Create gift tracking to prevent duplicate rewards
  - **Expected Gameplay**: When you reach 100 support with a character, they'll reward you with gifts. Major characters give the most gifts. Characters won't give gifts again for several seasons.
  - **Expected UI**: Notification popups showing "[Character Name] has given you [X] gifts!" Character profiles should show cooldown indicators and updated dependence levels.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Cross-Character Suspicion Effects





  - Implement ambitious message effects that, WHEN player gives an ambitious message to a target with ambition >= 0.7, SHALL increase suspicion by 0.1 for all characters in opposing factions (use enqueueActions to broadcast the effect to all relevant characters)

  - Add "spit in face" effects that, WHEN player spits in face of a character, SHALL increase suspicion by 0.1 for all characters in that character's faction (use enqueueActions to broadcast the effect to all relevant characters)

  - Add notification system showing when actions affect multiple characters (UI toast / modal with concise summary per action)

  - Implement loyal action benefits that, WHEN player performs a loyal action, SHALL reduce suspicion by 0.05 for characters with loyalty >= 0.1 (use enqueueActions to broadcast the effect to all relevant characters)

  - Expected Gameplay: Your actions with one character will affect others. Ambitious behavior will make faction-mates suspicious. Insulting someone will ripple alarm through their faction. High influence cascades fear to non-faction characters.

  - Expected UI: Notifications showing "Your ambitious words have made faction members suspicious" or "Other [type/faction] are disturbed by your behavior." Multiple character stats should update simultaneously with short on-screen text and optional detailed log.

  - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

- [x] 5. Random Character Assignment











  - Add helper functions near the top of game-machine.ts: selectCharacterPool (responsible for choosing 6–8 characters each season, enforcing 60% thematic / 40% variety, and guaranteeing the three majors), plus small helpers used by it (e.g., randInt, shuffle). selectCharacterPool should accept the full character catalog and the current playerPath ('prince' | 'minister' | 'concubine' | null) and return the selected pool for the season.

  - Data expectation: initialCharacters entries should include (or be extended to include) an optional paths property to support thematic picks (values: 'prince'|'minister'|'concubine' (include Empress Dowager in concubine pool)).

  - In game-machine.ts — modify INITIALIZE_GAME (initialize_game state, the action that spawns characters):

	  - Replace the existing spawn-all behavior with logic that calls selectCharacterPool(initialCharacters, context.characterType) to get the season pool, then spawn only the returned characters.

	  - When spawning, use spawn(characterMachine, { id: characterName, input: charData }) (i.e., spawn the imported characterMachine with the spawn id set to the character name and input set to the character data).

	  - Keep the existing applyInitialInfluenceFear call, but ensure it runs against the spawned pool rather than all initialCharacters.

  - In game-machine.ts — modify advancing_season (advancing_season state, entry actions):

	  - Add a seasonal reselection step that calls selectCharacterPool(initialCharacters, context.characterType) on every season advance (every time advancing_season runs).

	  - Replace/refresh the current context.characters set to reflect the newly selected pool:
		  - Stop child actors for characters not in the new pool (use stopChild by spawn id).

		  - Spawn new character actors for characters newly added to the pool (use spawn(characterMachine, ...)).

	  - After replacing actors, continue existing advancing_season behavior (season increment, giftsRemaining addition, applyInfluenceFear if applicable, and send UPDATE_SEASON to all current context.characters). Ensure UPDATE_SEASON is sent only to the actors present in context.characters after the reselection.

  - In game-machine.ts — ensure the in-season logic that sends events to characters (GIVE_GIFT_SIMPLE, GIVE_GIFT_WITH_MESSAGE, SPIT_IN_FACE) resolves the target against the current context.characters map created by the pool selection (i.e., the event.characterId should match spawn ids present in context.characters that were selected this season).

  - In game-machine.ts — modify game_over -> RESTART_GAME:

	- Ensure RESTART_GAME clears/stops any remaining character actors (stopChild for each spawn id in context.characters) and clears context.characters so that a subsequent INITIALIZE_GAME will generate a completely new random pool.

	- Ensure INITIALIZE_GAME called during a restart uses selectCharacterPool so the new game gets a fresh pool.

  - Ensure major characters (Crown Prince, Prime Minister, Empress Consort) are always included by selectCharacterPool and therefore always spawned every season; selection logic must treat majors as mandatory entries when composing the 6–8 pool.

  - Ensure per-path pools: selectCharacterPool must weight picks so ~60% of non-major slots come from characters tagged for the current player path, and ~40% come from variety/neutral characters. If there are insufficient thematic candidates, fill remaining slots from variety candidates. Pool size should be randomized between 6 and 8 each season.

  - Ensure type safety and avoid using any when defining game context

  - **Expected Gameplay**: On every season transition the game replaces the visible/active roster with a fresh pool of 6–8 characters (not just at game start). The three major political figures always appear. The seasonal pool favors characters matched to your chosen path (~60% thematic), but also includes variety (~40%). Restarting the game produces a completely new set.

  - **Expected UI**: Character selection/roster UI should change each season and each new game. Show the current season’s selected roster and indicate which characters are part of the player-path thematic picks. Major characters should always appear in the roster.
- [x] 6. Faction Auto-Formation














  - Implement faction assignment logic based on personality vectors (Rebel: ambition > 0.7 & loyalty < 0.4, Imperial: loyalty > 0.7 & influence > 0.5, Loyalist: fear > 0.6 & loyalty > 0.5)
  - Add faction membership tracking to game state and character profiles (see more in Design spec)
  - Create faction effects: +10 support + 20% trust when gaining support with faction members, -10 support + 20% suspicion with opposing faction members
  - Implement faction membership offers when faction has 3+ members at 80+ support
  - Add UI indicators showing character faction membership with colors or badges
  - Add information cards/boxes with faction information like how many members each faction has & the player's current faction & how close they are to each faction
  - Create faction bonus activation system when player joins a faction
  - **Expected Gameplay**: Characters will naturally form political factions based on their personalities. Supporting faction members will boost your standing with the entire faction but hurt you with opposing factions.
  - **Expected UI**: Character portraits should show faction badges (Rebel/Imperial/Loyalist/Independent). Faction membership offers should appear as notifications. Support changes should show faction bonuses/penalties.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [ ] 7. Character Dislike Vector
  - Create dislike calculation based on vector similarity (difference < 0.3 = dislike 0.2-0.4) and promotion competition (0.5-0.7 dislike)
  - Implement dislike effects that slow relationship building by 50% when dislike > 0.6
  - Add hostile comments for characters with high dislike levels
  - Create dislike increase/decrease mechanics based on player actions matching/opposing character traits
  - Update character initialization to calculate initial dislike values
  - Add seasonal dislike decay when player consistently acts against character's disliked traits
  - **Expected Gameplay**: Some characters will naturally dislike you based on similarity or competition. These relationships will be harder to build and characters may make hostile comments.
  - **Expected UI**: Character profiles should show dislike levels. Hostile characters should make negative comments in their responses. Relationship progress should be visibly slower with disliked characters.
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 8. Influence-Based Fear Cascade
  - Create fear calculation system where player influence > 0.6 increases fear for non-faction characters by (influence - 0.6) * 0.5 each season
  - Add behavioral changes: characters with fear > 0.8 refuse ambitious messages, fear > 0.9 only accept cautious/loyal messages
  - Implement fearful comments in character responses when fear levels are high
  - Create fear decay mechanism (0.1 per season) when player influence decreases
  - Add faction immunity so same-faction characters don't gain influence-based fear
  - **Expected Gameplay**: As your influence grows, characters will become increasingly afraid of you, limiting your interaction options but making them more compliant.
  - **Expected UI**: High-fear characters should show limited message options. Character responses should include fearful language. Fear levels should be visible in character stats.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9. Conspiracy Detection System
  - Create conspiracy detection logic that triggers when player has 3+ characters with ambition > 0.7 at 80+ support
  - Add seasonal suspicion increases (0.2 per season) for loyal characters when conspiracy is detected
  - Implement Imperial faction hostility when conspiracy is detected
  - Create investigation events for large conspiracies (5+ members) with random event triggers
  - Add player choice system for abandoning conspiracy or risking execution during investigations
  - **Expected Gameplay**: Building a large group of ambitious supporters will be detected as a conspiracy, making loyal characters suspicious and triggering investigation events.
  - **Expected UI**: Conspiracy detection should trigger notifications. Investigation events should present choices. Loyal characters should show increasing suspicion levels over time.
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Seasonal Vector Evolution
  - Implement loyalty vector increases (0.05) for characters with high support for 3+ seasons
  - Add fear vector increases (0.1) when characters witness executions
  - Create ambition vector increases (0.03) for successful faction members
  - Implement vector drift toward neutral for isolated characters (no faction, low support)
  - Add major political event vector adjustments based on character personality types
  - **Expected Gameplay**: Character personalities will gradually evolve based on their experiences and relationships. Long-term allies become more loyal, while isolated characters become more neutral.
  - **Expected UI**: Character personality stats should show gradual changes over seasons. Major events should cause visible personality shifts across multiple characters.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_