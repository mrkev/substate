# Marked state vs structured-state: review

Assessment of `marked-subbable` + `marked-serializable` against `structured-state`.

**Verdict:** the marked direction is better. Freeze `structured-state` as a reference and keep developing the marked packages. Before porting more features, fix the containment bugs below and settle how history will work.

## What the marked packages get right

1. **Reactivity via a `$$mark` field instead of a base class.** In structured-state every reactive type re-implements the subscribe/hash/container fields, and `isContainable` is a hard-coded list of `instanceof` checks (so `Contained.ts` imports every concrete class). In marked-subbable any object with a `$$mark` is reactive:
   - User classes (e.g. `MAudioTrack`) become reactive without inheriting from anything.
   - `MarkedArray` / `MarkedMap` / `MarkedSet` extend the real `Array` / `Map` / `Set`, so `Array.isArray`, spread, iteration and third-party code just work. No need for `ArrayWithoutIndexer` or `_getRaw()`.
2. **Reactivity and serialization are separate.** In structured-state the core is tied to history: `LinkedPrimitive.set` calls `saveForHistory`, which serializes, and every object registers in a global `WeakRefMap`. The marked-subbable core is ~400 lines, has no global state, and doesn't know serialization exists.
3. **Explicit serialization instead of reflection.** `Struct` discovers fields by iterating properties, relies on `UNINITIALIZED_*` placeholders and a list of internal keys to skip. `SerializationMark` gives a stable `kind` string plus explicit `construct` / `describe`. Constructors can take extra arguments that aren't in the saved data. (`Structured` was already heading this way.)
4. **Shared objects serialize correctly.** Every node is a reference in a lookup table, so an object reachable from two places is saved once. structured-state throws `"already referenced. Not supported yet"` and warns on multiple containers.
5. **Works with the React Compiler.** `useLink` returns a new `() => obj` each render, so compiled components see a changed value. structured-state's `useContainer` returns the same `obj`, so compiled components can show stale output.

## What's worse or missing

- **Boilerplate.** `MAudioTrack` names its fields four times (constructor, `register`, `Descriptor` type, `describe`). structured-state does it with one line per field. Don't bring back property inspection; add an optional helper layer that generates the mark and serialization from a field list.
- **History / undo.** The real gap. structured-state's undo restores old state *into existing objects* (components holding references stay valid), which relies on stable ids. `constructSimplifiedPackage` only builds new objects with new ids, so an id-keyed history stack can't map back to live objects. Decide on restore-in-place and id stability across save/load next. `site/src/marked/exp/historyStackFor.tsx` is the starting point.
- `DirtyObserver` (easy port), unions, schema validation.

## Bugs

- [ ] **`MarkedMap.clear` / `MarkedMap.replace`** call `uncontain(this)` and `contain(map)`, which iterate `[key, value]` tuples, not values (`packages/marked-subbable/src/MarkedMap.tsx`). Values are never unlinked on clear and never linked on replace. *Confirmed with a probe test.*
- [ ] **`MarkedArray.splice(start)`** removes nothing: it forwards `deleteCount` even when `undefined`, and native `splice` reads an explicit `undefined` as 0 (`packages/marked-subbable/src/MarkedArray.ts`). It also notifies even when nothing changed. *Confirmed with a probe test.*
- [ ] **Map deserialization is broken.** `initializeMarkedMap` uses `.map((key, value) => …)` but the callback receives `(entry, index)` (`packages/marked-serializable/src/construct.ts`).
- [ ] **`simplify` doesn't check for already-visited nodes** before recursing (`packages/marked-serializable/src/simplify.ts`). Cycles recurse forever; shared subtrees are re-serialized on every visit. Recording the node before recursing fixes both.
- [ ] **Duplicates aren't ref-counted.** Containers are tracked in a `Set`. If an array holds the same child twice and one copy is removed, the child stops notifying the array. `fill` works around this; `pop` / `shift` / `splice` (and duplicate `MarkedMap` values) don't.
- [ ] **Direct index writes skip notifications.** Because `MarkedArray` extends `Array`, `arr[i] = x` and `arr.length = 0` mutate without notifying. Document it or wrap in a Proxy.

## Suggested order

1. Fix the containment bugs above, with tests.
2. Design history for the marked packages (stable ids, restore-in-place); promote `historyStackFor` out of `exp/`.
3. Add the helper layer to cut boilerplate; port `DirtyObserver`.
4. Freeze structured-state as a reference.
