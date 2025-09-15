# Influence-Gated Actions - Manual Testing Guide

## Test Scenarios

### Test 1: Concubine vs High-Influence Characters
**Setup**: Start as Concubine (0.0 influence)
**Target**: Navigate to Empress Dowager (0.8+ influence) or Prime Minister (0.7+ influence)

**Expected Results**:
- Should see message: "They consider you beneath their notice"
- All action buttons should be replaced with this message
- Should show: "Build your influence to interact with this character"

### Test 2: Prince vs High-Influence Characters  
**Setup**: Start as Prince (0.5 influence)
**Target**: Navigate to Empress Dowager (0.8+ influence)

**Expected Results**:
- Can interact (0.5 > 0.8 - 0.3 = 0.5, so exactly at threshold)
- "Spit in Face" should be disabled (influence > 0.6)
- "Ambitious" message should be disabled (influence > 0.8)
- Should see tooltips explaining why actions are disabled

### Test 3: Prince vs Medium-Influence Characters
**Setup**: Start as Prince (0.5 influence)  
**Target**: Navigate to side characters like Prince Feng (0.1-0.3 influence)

**Expected Results**:
- All actions should be available
- No disabled buttons or restriction messages
- Can use all message types and "Spit in Face"

### Test 4: Minister vs Various Characters
**Setup**: Start as Minister (0.3 influence)
**Target**: Test with different character types

**Expected Results**:
- Major characters (0.7+ influence): Should be blocked from interaction
- Side characters (0.1-0.3 influence): Should have full access
- Some major characters might allow interaction but block hostile actions

### Test 5: Influence Growth Testing
**Setup**: Start as any character type
**Action**: Get promoted to increase influence by 0.4

**Expected Results**:
- Previously blocked characters should become accessible
- Previously disabled actions should become available
- UI should update dynamically to reflect new influence level

## UI Elements to Verify

1. **Disabled Button Styling**: Grayed out buttons with `cursor-not-allowed`
2. **Tooltips**: Hover over disabled buttons to see explanatory text
3. **Interaction Refusal**: Complete replacement of action buttons with refusal message
4. **Visual Feedback**: Small italic text under disabled actions explaining why
5. **Dynamic Updates**: Changes when player influence increases through promotions

## Key Messages to Look For

- "They are too powerful to insult directly" (Spit in Face blocked)
- "They are too influential for threatening messages" (Ambitious message blocked)  
- "They consider you beneath their notice" (Complete interaction refusal)
- "Build your influence to interact with this character"

## Character Influence Reference

**Major Characters (0.7-1.0 influence)**:
- Empress Dowager: ~0.8-1.0
- Prime Minister: ~0.7-1.0  
- Crown Prince: ~0.7-1.0
- Empress Consort: ~0.7-1.0

**Side Characters (0.1-0.3 influence)**:
- Princes: ~0.1-0.3
- Ministers: ~0.1-0.3
- Concubines: ~0.1-0.3

**Minor Characters (0.2-0.4 influence)**:
- Maids: ~0.2-0.4

## Player Starting Influence
- Prince: 0.5
- Minister: 0.3  
- Concubine: 0.0