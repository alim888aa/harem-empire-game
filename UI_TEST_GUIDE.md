# UI Integration Test Guide

## How to Test the State Machine Integration

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Character Selection
- Open browser to dev server URL (usually http://localhost:5173)
- Should see character selection screen with 3 options
- Click any character type (Prince, Minister, or Concubine)
- Should see brief loading screen, then main game interface

### 3. Verify Game State Display
Check that the header shows correct values:
- **Season**: Should show "Season 1"
- **Support**: Should show "Support 0" 
- **Gifts**: Should show "Gifts 15"
- **Rank**: Should show your selected character type

### 4. Test Character Navigation
- Use Previous/Next buttons around character display
- Should cycle through all characters from initialCharacters
- Character name should update in the display
- Support level should show for each character

### 5. Test Gift Actions

#### Simple Gift Test:
1. Click "Give Simple Gift" button
2. Check console for action log
3. Gifts should decrease by 1 (minor) or 5 (major/side)
4. Character support should increase by 5

#### Gift with Message Test:
1. Click any message button (Ambitious, Loyal, Cautious, Neutral)
2. Check console for action log
3. Gifts should decrease by cost
4. Character support should change based on personality compatibility
5. May see character response in console

#### Spit in Face Test:
1. Click "Spit in Face" button
2. Character support should decrease by 20
3. Character suspicion should increase

### 6. Test Season Progression
1. Click "Next Season" button in header
2. Season should increment to 2
3. Gifts should increase by 15
4. Support points may be recalculated

### 7. Test Stats Modal
1. Click "Stats" button in header
2. Modal should open showing player personality stats
3. Should show values based on selected character type
4. Click outside or close to dismiss

## Expected Console Output

Look for these logs:
```
Action performed: gift on [Character Name]
Navigating to next character: [Character Name]
Opening stats modal
```

## Success Criteria

✅ Character selection works and loads game
✅ All header values display correctly from state machine
✅ Character navigation cycles through all characters
✅ Gift actions update gifts and character support
✅ Season progression increments season and adds gifts
✅ Stats modal shows player personality data
✅ No console errors about missing GameCharacters
✅ State machine events are being sent correctly

## Troubleshooting

**If you see "GameCharacters not defined" errors:**
- The old game.js is still running - clear browser cache

**If character navigation doesn't work:**
- Check that initialCharacters is being used correctly

**If actions don't work:**
- Check console for XState event logs
- Verify character names match between UI and state machine

**If stats don't show:**
- Check that playerPersonality is being set during initialization

## Advanced Testing

Once basic functionality works, test edge cases:
- Give gifts until you run out
- Try to trigger character support/allegiance events
- Test emperor encounter (season 2+)
- Test promotion mechanics (80+ support points)