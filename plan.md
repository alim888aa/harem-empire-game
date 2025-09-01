Implementation Difficulty Ratings (1-5, 1=Easy, 5=Hard)
Easy (1-2) - Start Here:
Multiple Choice Messages (1) - Just replace textarea with buttons
Trust-Based Support Bonuses (1) - Simple if/else in existing gift logic
Influence-Gated Actions (1) - Add condition to button rendering
Player Vector System (2) - Extend existing vector logic to player
Show Character Stats at Trust 0.5+ (2) - Conditional UI rendering
Medium (3) - Second Phase:
Suspicion Vector + Execution (3) - New vector + game over condition
Random Character Assignment (3) - Modify character initialization
Faction Auto-Formation (3) - Group characters by vector similarity
Trust 1.0 = Gift Rewards (3) - Add reverse gift mechanic
Weighted Character Assignment by Path (3) - Character pool logic
Hard (4-5) - Later:
Vector-Based Event Generation (4) - Need event system first
Character-to-Character Relationships (4) - Complex relationship matrix
Vector Decay/Evolution (4) - Seasonal character progression
Predictive Relationship Modeling (5) - Complex UI + simulation
AI-Generated Messages/Responses (5) - API integration + prompt engineering
Recommended MVP v2 Implementation Order:
Sprint 1: Core Vector Improvements
Multiple choice messages (4 options per interaction)
Trust-based support bonuses
Player vector system with path-based starting stats
Show character vector stats when trust >0.5
Sprint 2: Risk/Reward Systems
Suspicion vector + execution mechanic
Influence-gated actions (can't insult high-influence characters)
Trust 1.0 gift rewards
Sprint 3: Dynamic Character System
Random character assignment (6 characters per game)
Weighted assignment by player path
Faction auto-formation with joining mechanics