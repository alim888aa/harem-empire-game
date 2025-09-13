# Design Document

## Overview

The React UI will be built as a single-page application using functional components and TypeScript. The design follows a modular approach where each UI section is a separate component, making it easy to test and iterate on individual pieces.

## Architecture

```
src/
├── components/
│   ├── GameHeader.tsx          # Header with stats and buttons
│   ├── CharacterDisplay.tsx    # Character sprite and navigation
│   ├── CharacterInfo.tsx       # Character details panel
│   ├── ActionButtons.tsx       # Interaction buttons
│   ├── StatsModal.tsx         # Player stats popup
│   └── GameLayout.tsx         # Main layout container
├── types/
│   └── game.ts                # TypeScript interfaces
├── data/
│   └── characters.ts          # Mock character data
└── main.tsx                   # App entry point
```

## Components and Interfaces

### GameLayout Component
- **Purpose**: Main container that orchestrates all other components
- **State**: Current character index, stats modal visibility
- **Props**: None (root component)
- **Layout**: CSS Grid with header and main content areas

### GameHeader Component
- **Purpose**: Display game status and stats button
- **Props**: `{ season: number, support: number, gifts: number, rank: string, onStatsClick: () => void }`
- **Layout**: Flexbox with stats on left, button on right
- **Styling**: Rounded border, padding, background color

### CharacterDisplay Component
- **Purpose**: Show character sprite with navigation arrows
- **Props**: `{ character: Character, onPrevious: () => void, onNext: () => void }`
- **Layout**: Flexbox with arrows flanking centered image
- **Features**: 300px image width, hover effects on arrows

### CharacterInfo Component
- **Purpose**: Display character details in right panel
- **Props**: `{ character: Character }`
- **Layout**: Vertical stack with consistent spacing
- **Styling**: Rounded panel matching wireframe design

### ActionButtons Component
- **Purpose**: Three interaction buttons
- **Props**: `{ character: Character, onAction: (action: string) => void }`
- **Layout**: Vertical button stack
- **Features**: Disabled state for restricted actions

### StatsModal Component
- **Purpose**: Popup showing player statistics
- **Props**: `{ isOpen: boolean, onClose: () => void, playerStats: PlayerStats }`
- **Layout**: Centered modal with backdrop
- **Features**: Click-outside-to-close, smooth animations

## Data Models

### Character Interface
```typescript
interface Character {
  id: string;
  name: string;
  type: 'Major' | 'Minor' | 'Side';
  support: number;
  personality: string;
  imagePath: string;
  influence: number; // For action restrictions
}
```

### PlayerStats Interface
```typescript
interface PlayerStats {
  influence: number;
  ambition: number;
  loyalty: number;
  fear: number;
  suspicion: number;
}
```

### GameState Interface
```typescript
interface GameState {
  season: number;
  support: number;
  gifts: number;
  rank: string;
  currentCharacterIndex: number;
  showStatsModal: boolean;
}
```

## Error Handling

### Image Loading
- **Fallback**: Display placeholder image if character sprite fails to load
- **Implementation**: Use `onError` handler on img elements
- **User Experience**: Graceful degradation without breaking layout

### Character Data
- **Validation**: Ensure character arrays are not empty
- **Fallback**: Show "No characters available" message
- **Navigation**: Disable arrows when no characters exist

### Modal State
- **Cleanup**: Properly close modals on component unmount
- **Accessibility**: Focus management and escape key handling
- **Backdrop**: Prevent body scroll when modal is open

## Testing Strategy

### Manual Testing Approach
Each requirement will be tested by loading the app in the browser and verifying expected behavior:

1. **Layout Testing**: Check that components render in correct positions
2. **Interaction Testing**: Click buttons and verify console logs or state changes
3. **Navigation Testing**: Use arrow buttons to cycle through characters
4. **Modal Testing**: Open/close stats modal and verify proper behavior
5. **Responsive Testing**: Resize browser window to check layout adaptation

### Component Testing
- **Isolation**: Test each component individually by rendering it alone
- **Props Testing**: Pass different prop values and verify rendering
- **State Testing**: Trigger state changes and verify UI updates
- **Event Testing**: Click elements and verify callbacks are called

### Integration Testing
- **Character Flow**: Navigate through all characters and verify data consistency
- **Modal Flow**: Open stats, interact with other elements, close modal
- **Action Flow**: Click action buttons and verify proper character context

## Styling Approach

### Tailwind CSS
- **Framework**: Use Tailwind CSS for all styling instead of custom CSS
- **Layout**: Utilize Tailwind's flexbox and grid utilities
- **Responsive**: Use Tailwind's responsive prefixes for mobile adaptation
- **Components**: Apply Tailwind classes directly to JSX elements
- **Consistency**: Use Tailwind's spacing, color, and typography scales

### Key Tailwind Patterns
- **Layout**: `flex`, `grid`, `justify-center`, `items-center`
- **Spacing**: `p-4`, `m-2`, `space-y-4`, `gap-4`
- **Styling**: `bg-gray-100`, `rounded-lg`, `shadow-md`, `border`
- **Interactive**: `hover:bg-gray-200`, `transition-colors`, `cursor-pointer`
- **Typography**: `text-lg`, `font-semibold`, `text-center`

## Implementation Phases

### Phase 1: Basic Layout and Static Content
- Create GameLayout component with Tailwind grid layout
- Build GameHeader with hardcoded stats using Tailwind flexbox
- Add CharacterDisplay with static Prime Minister image
- Style with Tailwind classes to match wireframe proportions
- **Test**: Verify layout renders correctly in browser

### Phase 2: Character Navigation and Data
- Create Character interface and mock character data array
- Add CharacterInfo panel with character details
- Implement arrow navigation to cycle through characters
- Add ActionButtons component with three styled buttons
- **Test**: Click arrows to navigate, verify character info updates

### Phase 3: Interactive Features and Polish
- Add StatsModal component with player statistics
- Implement modal open/close functionality
- Add button click handlers with console logging
- Apply hover effects and transitions using Tailwind
- **Test**: Open stats modal, click action buttons, verify all interactions work