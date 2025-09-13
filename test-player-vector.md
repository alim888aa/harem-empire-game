# Player Vector System Test

## Test Steps

1. **Start a new game** - Choose any character type
2. **Check initial stats** - Open stats modal to see initial player personality and reputation
3. **Give gifts with different message types**:
   - Give an **ambitious** message - should increase ambition (+0.03) and perceived threat (+0.05)
   - Give a **loyal** message - should increase loyalty (+0.03) and perceived loyalty (+0.02)
   - Give a **cautious** message - should increase fear (+0.02) and trustworthiness (+0.01)
4. **Test trust compound bonus** - Build trust with a character and observe faster relationship growth
5. **Test emperor loyalty bypass** - Build perceived loyalty above 0.8 and trigger emperor encounter with < 10 gifts

## Expected Results

### Initial Values
- Player Personality: All stats start at 0.0 except charisma (varies by character type)
- Player Reputation: 
  - Perceived Loyalty: 50%
  - Perceived Threat: 30%
  - Trustworthiness: 60%
  - Political Skill: 40%

### After Actions
- **Ambitious actions**: Ambition and Perceived Threat should increase
- **Loyal actions**: Loyalty and Perceived Loyalty should increase
- **Cautious actions**: Fear and Trustworthiness should increase
- **High trust characters**: Political Skill should increase when interacting with characters who have >80% trust

### Emperor Encounter
- With < 10 gifts but > 80% perceived loyalty: Should show "Your perceived loyalty saves you from execution" message
- Should be able to refuse emperor and still survive with high loyalty

## UI Changes
- Stats modal should now show both "Player Personality" and "Court Reputation" sections
- Reputation values should be displayed as percentages
- Player stats should update immediately after giving gifts with messages