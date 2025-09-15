# Gift Reward System - Manual Test Guide

## Test Objectives
Verify that the Gift Reward System works according to requirements:

1. Characters give gifts when reaching 100 support or 100% loveForPlayer
2. Gift amounts: Major=10, Side=5, Minor=1
3. 3-season cooldown after giving gifts
4. UI shows cooldown indicators
5. Dependence increases by 0.2 when gifts are given

## Expected Cooldown Behavior
If a character gives gifts at season 1:
- Season 1: Gift status shows "Cooldown (3 seasons)"
- Season 2: Gift status shows "Cooldown (2 seasons)" 
- Season 3: Gift status shows "Cooldown (1 seasons)"
- Season 4: Gift status shows "Can give gifts"

## Test Steps

### Test 1: Basic Gift Giving
1. Start a new game and choose any character type
2. Find a minor character (Maid) - easiest to reach 100 support
3. Give gifts repeatedly until support reaches 100
4. **Expected**: Alert popup showing "[Character Name] has given you 1 gifts!"
5. **Expected**: Character's dependence should increase by 20%
6. **Expected**: Gift status should show "Cooldown (3 seasons)"

### Test 2: Different Character Types
1. Repeat Test 1 with a side character (Prince/Minister/Concubine)
2. **Expected**: Alert showing "5 gifts"
3. Repeat with a major character (Crown Prince/Prime Minister/Empress Consort/Empress Dowager)
4. **Expected**: Alert showing "10 gifts"

### Test 3: Cooldown System
1. After a character gives gifts at season X, note the season number
2. Advance 1 season: **Expected**: Gift status shows "Cooldown (2 seasons)"
3. Advance 1 more season: **Expected**: Gift status shows "Cooldown (1 seasons)"
4. Advance 1 more season: **Expected**: Gift status shows "Can give gifts"
5. Build support back to 100
6. **Expected**: Character should give gifts again

### Test 4: UI Indicators
1. Check character info panel for gift status display
2. **Expected**: Shows one of:
   - "No gifts given" (never gave gifts)
   - "Cooldown (X seasons)" (in cooldown)
   - "Can give gifts" (cooldown expired)

### Test 5: Love-Based Gift Giving
1. Use message interactions to build loveForPlayer to 100% (1.0)
2. **Expected**: Character should give gifts even if support < 100

## Debug Console Output
Watch browser console for:
- "[Character] is giving gifts! Support: X, Love: Y"
- "Game machine received CHARACTER_GAVE_GIFTS from [Character]"
- "Adding X gifts from [Character]. Total will be: Y"
- "Sending UPDATE_SEASON to all characters. New season: X"
- "[Character] cooldown: until=X, current=Y, remaining=Z"

## Cooldown Fix Applied
The cooldown system has been fixed to:
1. Track current season in character machine context
2. Set cooldown immediately when gifts are given using correct current season
3. Calculate cooldown as currentSeason + 3 seasons
4. Reset cooldown when the target season is reached
5. Prevent race conditions between season advancement and gift giving

## Cooldown Issue Debugging
If cooldown shows wrong values:
1. Check console for "Setting gift cooldown until season X" messages
2. Verify that giftCooldownUntil is set correctly when gifts are given
3. Verify that currentSeason is being passed correctly to UI
4. Check that cooldown calculation (giftCooldownUntil - currentSeason) is correct

## Known Issues to Watch For
- Cooldown not resetting after 3 seasons
- Wrong gift amounts for character types
- Multiple gift giving from same character
- UI not updating cooldown status
- Dependence not increasing
- Cooldown counting backwards incorrectly