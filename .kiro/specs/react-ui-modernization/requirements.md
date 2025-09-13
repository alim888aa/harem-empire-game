# Requirements Document

## Introduction

Create a React-based UI that matches the wireframe design for the Harem Empire game. Build it incrementally so each step can be visually tested in the browser.

## Requirements

### Requirement 1: Basic Layout Structure

**User Story:** As a player, I want to see the basic game layout with header and main content areas.

#### What You'll See in Browser:
1. Header bar with placeholder text for "Season: 1", "Support: 0", "Gifts: 15", "Rank: Concubine"
2. Stats button in the top right corner
3. Main content area below the header
4. Clean, centered layout that matches the wireframe proportions

### Requirement 2: Character Display Area

**User Story:** As a player, I want to see a character sprite displayed in the center with navigation arrows.

#### What You'll See in Browser:
1. Character sprite (300px wide) centered in the left side of the main area
2. Left arrow (←) and right arrow (→) on either side of the character
3. Character sprite loads from `/public/prime-minister.png` initially
4. Arrows are clickable but don't do anything yet (just console.log for now)

### Requirement 3: Character Information Panel

**User Story:** As a player, I want to see character details in a panel next to the sprite.

#### What You'll See in Browser:
1. Right panel showing character name "Prime Minister"
2. Character type "Type: Major" 
3. Support level "Support: 18/100"
4. Personality trait "Personality: Ambitious"
5. Panel has rounded corners and proper spacing like the wireframe

### Requirement 4: Action Buttons

**User Story:** As a player, I want to see three action buttons I can click.

#### What You'll See in Browser:
1. Three buttons stacked vertically: "Give Simple Gift", "Give Gift with a Message", "Spit in Face"
2. Buttons are properly styled and sized
3. Clicking buttons shows console.log messages for now
4. Buttons have hover effects

### Requirement 5: Character Navigation

**User Story:** As a player, I want to cycle through different characters using the arrow buttons.

#### What You'll See in Browser:
1. Clicking left/right arrows changes the displayed character
2. Character sprite, name, and info all update together
3. At least 3 different characters to cycle through (using existing sprites from `/public/`)
4. Smooth transitions between characters

### Requirement 6: Interactive Stats Button

**User Story:** As a player, I want to click the Stats button and see player information.

#### What You'll See in Browser:
1. Clicking "Stats" button opens a modal or popup
2. Modal shows player stats like "Influence: 0.3", "Ambition: 0.7", etc.
3. Modal can be closed by clicking outside or an X button
4. Modal is properly styled and centered