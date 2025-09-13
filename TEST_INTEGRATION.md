# State Machine Integration Test Guide

## How to Test the Integration

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Character Selection
- Open the browser to the dev server URL (usually http://localhost:5173)
- You should see the character selection screen
- Click on any character type (Prince, Minister, or Concubine)
- You should see a loading screen briefly, then the main game interface

### 3. Test Game State Display
Once in the game, verify these elements show correct values:
- **Season**: Should show "Season 1"
- **Support**: Should show "Support 0" 
- **Gifts**: Should show "Gifts 15"
- **Rank**: Should show the character type you selected (Prince/Minister/Concubine)

### 4. Test Character Navigation
- Use the Previous/Next buttons around the character image
- Should cycle through all available characters
- Character info should update for each character

### 5. Test Gift Actions
Try each action and check the console for logs:

#### Simple Gift
- Click "Give Simple Gift" button
- Should deduct the correct number of gifts (1 for minor, 5 for major/side characters)
- Character support should increase by 5 points
- Check browser console for action logs

#### Gift with Message
- Click any of the message type buttons (Ambitious, Loyal, Cautious, Neutral)
- Should deduct gifts and potentially show character response
- Support should change based on character personality compatibility
- Check console for detailed logs

#### Spit in Face
- Click "Spit in Face" button
- Should decrease character support by 20 points
- Should increase character suspicion

### 6. Test Season Progression
- Click "Next Season" button in the header
- Season should increment
- Gifts should increase by 15
- Support points should be recalculated

### 7. Test Stats Modal
- Click "Stats" button in header
- Modal should open showing player personality stats
- Click outside or close button to dismiss

## Expected Console Output

You should see logs like:
```
Action performed: gift on [Character Name]
Navigating to next character: [Character Name]
Opening stats modal
```

## Common Issues to Check

1. **Character actors not spawning**: Check browser console for XState errors
2. **Actions not working**: Verify event types match between UI and state machine
3. **State not updating**: Check that machine context is being read correctly
4. **Character support not changing**: Verify character machine is receiving events

## Debug Tips

1. Open browser dev tools and check the Console tab for errors
2. In the React DevTools, look for the XState machine state
3. Add `console.log(state.context)` in GameLayout to see current machine state
4. Check Network tab to ensure no missing imports

## Success Criteria

✅ Character selection works and transitions to game
✅ All UI elements display correct values from state machine
✅ Gift actions update character support and player gifts
✅ Season progression works correctly
✅ Character navigation works
✅ Stats modal opens and closes
✅ No console errors related to XState or React