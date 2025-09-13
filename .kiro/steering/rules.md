---
inclusion: always
---

# Development Guidelines for Harem Empire Game

## Testing & Quality Assurance
- **No automated tests**: Do not create or run automated test files
- **UI-based testing**: All testing must be performed through the game UI and gameplay interactions
- **Manual verification**: Ensure features work correctly by playing through the game scenarios

## State Management Architecture
- **State machine priority**: Use existing state machines for all state management whenever possible
- **Minimal React state**: Avoid `useState` and `useEffect` unless absolutely necessary
- **Document React usage**: When React hooks are required, clearly explain where and why they were used
- **State machine changes**: Make minimal modifications to state machines and document all changes with exact code snippets

## Code Quality & Maintenance
- **Modular design**: Keep code modular and reusable across components, functions, and types
- **Code cleanup**: Remove unnecessary files, functions, and dead code after completing tasks
- **Type safety**: Leverage existing TypeScript types and maintain type consistency

## Communication & Decision Making
- **Clarify uncertainties**: Always ask for clarification when task requirements are unclear
- **Architectural approval**: Request approval before making changes that significantly impact game architecture or state machine logic
- **Error reporting**: When encountering unfixable bugs, stop and clearly explain the problem and attempted solutions

## Development Workflow
- **Incremental changes**: Make small, focused changes that can be easily verified
- **Code reuse**: Prioritize reusing existing functions, components, and types over creating new ones
- **Documentation**: Clearly document any architectural or state management changes made
- Do not run dev or build commands.