# Enhanced Suspicion System - Manual Test Guide

## Test Implementation

The Enhanced Suspicion System has been implemented with the following features:

### 1. Suspicion Thresholds by Character Type
- **Major characters**: 0.5 threshold (50%)
- **Side characters**: 0.7 threshold (70%) 
- **Minor characters**: 0.9 threshold (90%)

### 2. UI Displays
- **Character Info Panel**: Shows both current suspicion and threshold percentages
- **Game Header**: Shows suspicious character count and execution threshold
- **Warning Notifications**: Appear when approaching execution threshold

### 3. Game Over Conditions
- **Concubine**: Game ends when 1 character becomes suspicious
- **Minister**: Game ends when 3 characters become suspicious  
- **Prince**: Game ends when 5 characters become suspicious

## Manual Testing Steps

### Test 1: Verify Suspicion Thresholds Display
1. Start a new game and choose any character type
2. Click on different characters to view their info panels
3. **Expected**: Each character should show both "Suspicion: X%" and "Threshold: Y%" 
4. **Expected**: Major characters should have 50% threshold, side characters 70%, minor characters 90%

### Test 2: Verify Suspicion Tracking
1. Look at the game header
2. **Expected**: Should show "Suspicious: 0/X" where X is the execution threshold for your character type
3. **Expected**: Concubine should show 0/1, Minister 0/3, Prince 0/5

### Test 3: Test SPIT_IN_FACE Suspicion Increase
1. Find a character with low suspicion (under their threshold)
2. Use "Spit in Face" action on them
3. **Expected**: Their suspicion should increase and be visible in their character info
4. **Expected**: If suspicion reaches their threshold, they should be added to suspicious list

### Test 4: Test Suspicious Character Detection
1. Continue using "Spit in Face" or other suspicion-raising actions
2. **Expected**: When a character's suspicion >= their threshold:
   - An alert should appear saying "[Character Name] is becoming suspicious!"
   - The suspicious count in the header should increase
   - A warning notification should appear if near execution threshold

### Test 5: Test Game Over Condition
1. Continue raising suspicion until you reach the execution threshold
2. **Expected**: Game should automatically transition to game over with defeat reason
3. **Expected**: Different thresholds based on character type (1 for concubine, 3 for minister, 5 for prince)

### Test 6: Test Different Character Types
1. Restart and try different player character types
2. **Expected**: Each should have different execution thresholds
3. **Expected**: Warning messages should reflect the correct threshold

## Expected Behaviors

### Character Suspicion Display
- Suspicion values should be color-coded (red for high, orange for medium, amber for low)
- Threshold should always be displayed alongside current suspicion
- Values should update in real-time as actions are performed

### Warning System
- Warning notifications should appear when suspicious count is near threshold
- Notifications should list which characters are suspicious
- Header should always show current count vs threshold

### Game Over
- Should trigger automatically when threshold is reached
- Should show defeat screen
- Should allow restart to test again

## Implementation Details

### Files Modified
- `src/types/character.ts`: Added suspicionThreshold to interfaces
- `src/data/characters.ts`: Added threshold values based on character type
- `src/state-machines/character-machine.ts`: Updated guard to use character's threshold
- `src/state-machines/game-machine.ts`: Enhanced CHARACTER_IS_SUSPICIOUS handler
- `src/components/CharacterInfo.tsx`: Added threshold display
- `src/components/GameHeader.tsx`: Added suspicious character count
- `src/components/GameLayout.tsx`: Added warning notifications

### Key Features
- Suspicion thresholds are set at character creation based on type
- Character machine uses individual thresholds in suspicion guard
- Game machine maintains authoritative suspicious characters list
- UI provides clear feedback on suspicion status and thresholds
- Automatic game over when execution threshold is reached