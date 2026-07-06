# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                        # Start site dev server
pnpm build                      # Build all packages (via Nx)
pnpm lint                       # ESLint (max-warnings 0)
pnpm tsc                        # Type check

# Testing
pnpm test                       # Run tests across all workspaces
cd packages/<pkg> && pnpm test  # Run tests for a single package
cd packages/<pkg> && pnpm exec vitest <file>  # Run a single test file
```

## Repository Structure

This is a **pnpm monorepo** using Nx for build orchestration. The packages represent an iterative research project exploring React state management approaches:

- `packages/linked-state` — Published package (`@mrkev/linked-state`). Uses linkable primitives with subscription-based reactivity.
- `packages/marked-subbable` — Alternative using a "mark/subscription" pattern with `SubbableMark` tokens for fine-grained change tracking.
- `packages/marked-serializable` — Serialization layer on top of `marked-subbable`. Peer-depends on it.
- `packages/structured-state` — Most evolved approach. Adds `Struct` class pattern, schema validation, history tracking, and `DirtyObserver`.
- `packages/old-state` — Archived previous implementation. Kept for reference only.
- `packages/site` — Demo/docs app that exercises all three live approaches.

## Core Architecture

### State Objects and Subscriptions

All packages expose four data structures: `Value`/`Primitive`, `Array`, `Map`, and `Set`. Each implements the `Subbable` interface:

- `subbable.subscribe(subscriber, callback)` — register for change notifications
- `subbable.mutated(subscriber, target)` — notify all subscribers, passing which `target` changed
- `_hash` field increments on every mutation; used with `useSyncExternalStore` in hooks

### Contained / Container Propagation

State objects track their parent containers. When a child mutates, it calls `notifyContainers()`, which propagates the mutation upward. This enables a container (e.g., a `Struct`) to re-render when any nested primitive changes, while still letting hooks distinguish shallow vs. deep changes.

### React Hooks

- `useLink(obj, recursive?)` — subscribes to an object, returns an accessor function. Components call this to opt into re-renders.
- `useLinkAsState(obj)` — returns `[value, setter]` tuple à la `useState`.
- Hooks use `useSyncExternalStore` internally. Some include `// use no memo` directives to prevent unnecessary memoization.

### Struct Pattern (structured-state)

```typescript
class Person extends Struct<Person> {
  age = number();
  children = array(Person);
}
const person = create(Person, { age: 30, children: [] });
```

`Struct` fields are declared as schema primitives (`number()`, `string()`, `array(...)`, etc.). The `create()` factory wires them into the subscription system. Schema types also drive serialization via `JSONOfAuto`.

### Factory Helpers

Each package provides shorthand factories:

- `linked-state`: `lValue()`, `lArray()`, `lMap()`, `lSet()`
- `marked-subbable`: `mValue()`, `mArray()`, `mMap()`, `mSet()`
- `structured-state`: `create(ClassName, initialData)`

### Serialization

- `marked-serializable`: `simplifyAndPackage()` / `constructSimplifiedPackage()`
- `structured-state`: schema-driven JSON serialization built into each type

### Debugging

- `DebugTree` component and `debugOutHtml()` / `debugOutText()` utilities (marked-subbable) render the live state graph
- `DirtyObserver` (structured-state) tracks which parts of state changed between renders
