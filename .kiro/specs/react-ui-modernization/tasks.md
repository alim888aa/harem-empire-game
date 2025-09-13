# Implementation Plan

Each task is designed to produce visible changes in the browser that you can test immediately. Run `npm run dev` and open the browser to see your progress after each task.

- [x] 1. Setup project structure and TypeScript interfaces
  - Create `src/types/game.ts` with Character, PlayerStats, and GameState interfaces
  - Create `src/data/characters.ts` with mock character data array using existing sprite names
  - _Requirements: 1, 2, 3_

- [x] 2. Create main GameLayout component and integrate existing CharacterSprite







  - [x] 2.1 Build GameLayout component with grid layout



    - Create `src/components/GameLayout.tsx` with main container using Tailwind grid
    - Set up header and main content areas matching wireframe proportions
    - Import and use existing CharacterSprite component in the layout
    - Update `src/main.tsx` to use GameLayout instead of CharacterSprite directly
    - **Test**: You should see the character sprite within a proper grid layout
    - _Requirements: 1, 2_

  - [x] 2.2 Create GameHeader component with static stats


    - Build `src/components/GameHeader.tsx` with flex layout
    - Display hardcoded "Season: 1", "Support: 0", "Gifts: 15", "Rank: Concubine"
    - Add Stats button with Tailwind styling
    - Import and use GameHeader in GameLayout
    - **Test**: You should see a header bar with stats and button above the character
    - _Requirements: 1_

- [x] 3. Enhance character display with navigation and information





  - [x] 3.1 Convert CharacterSprite to CharacterDisplay with navigation arrows


    - Rename `src/components/CharacterSprite.tsx` to `src/components/CharacterDisplay.tsx`
    - Add left and right arrow buttons (← →) on either side of character image
    - Add props for character data and navigation callbacks
    - Style with Tailwind for proper positioning and hover effects
    - **Test**: You should see navigation arrows that can be clicked (console.log for now)
    - _Requirements: 2, 5_

  - [x] 3.2 Create CharacterInfo panel component


    - Build `src/components/CharacterInfo.tsx` with character details
    - Display character name, type, support level, and personality
    - Style with Tailwind rounded panel matching wireframe design
    - Add to GameLayout next to CharacterDisplay
    - **Test**: You should see character details in a panel next to the sprite
    - _Requirements: 3_

  - [x] 3.3 Add character navigation state and connect components


    - Add useState for currentCharacterIndex in GameLayout
    - Import characters data and pass current character to components
    - Create navigation functions for previous/next character
    - Connect arrow buttons to navigation functions
    - **Test**: Clicking arrows should change both character image and info panel
    - _Requirements: 2, 3, 5_

- [x] 4. Add action buttons and interactive features





  - [x] 4.1 Create ActionButtons component


    - Build `src/components/ActionButtons.tsx` with three vertical buttons
    - Add "Give Simple Gift", "Give Gift with a Message", "Spit in Face" buttons
    - Style buttons with Tailwind and add click handlers with console.log
    - Add to GameLayout below character info
    - **Test**: You should see three clickable action buttons that log to console
    - _Requirements: 4_

  - [x] 4.2 Create StatsModal component


    - Build `src/components/StatsModal.tsx` with modal backdrop and content
    - Display player stats like influence, ambition, loyalty, fear, suspicion
    - Add close functionality with click-outside and X button
    - Style with Tailwind modal classes and backdrop blur
    - **Test**: Modal should render when opened (test by temporarily setting it to always show)
    - _Requirements: 6_

  - [x] 4.3 Connect Stats button to modal functionality


    - Add showStatsModal state to GameLayout component
    - Connect Stats button click to open modal
    - Implement modal close handlers and proper state management
    - **Test**: Clicking Stats button should open modal, clicking outside or X should close it
    - _Requirements: 6_

  - [x] 4.4 Add hover effects and polish with Tailwind


    - Apply hover:bg-gray-200 and transition classes to interactive elements
    - Add smooth character transition effects when navigating
    - Implement proper focus states and accessibility features
    - **Test**: All buttons and interactive elements should have smooth hover effects
    - _Requirements: 2, 4, 6_
