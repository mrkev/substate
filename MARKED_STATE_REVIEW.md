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

- [ ] **`simplify` doesn't check for already-visited nodes** before recursing (`packages/marked-serializable/src/simplify.ts`). Cycles recurse forever; shared subtrees are re-serialized on every visit. Recording the node before recursing fixes both.
- [ ] **Direct index writes skip notifications.** Because `MarkedArray` extends `Array`, `arr[i] = x` and `arr.length = 0` mutate without notifying. Since containment is ref-counted, direct writes also leave the counts wrong. Document it or wrap in a Proxy.

## Testing gaps

From a v8 coverage run (2026-11-16: `marked-subbable` 47% of lines, `marked-serializable` 53%; run `pnpm coverage`). A probe of every area below found no bugs, so these tests would protect working behavior.

1. [ ] **React hooks (0%).** `useLink` / `useLinkAsState` are untested. Cover: re-render on own change; with `recursive`, also on nested changes; no re-render for unrelated changes; `useLink` returns a new function each render (what keeps React Compiler output fresh); `useLinkAsState`'s `[value, setter]` incl. `setter(prev => …)`. Needs a DOM test environment (`happy-dom` or `jsdom`); `@testing-library/react` is already installed at the root.
2. [ ] **Notification propagation.** The loop guard in `_childChanged` (`SubbableContainer.tsx`, "token seen") is never exercised: two objects containing each other. Also untested: a grandparent's listener receives the grandchild as `target` on deep changes, which is how `useLink` tells shallow from deep.
3. [ ] **Serialization beyond `MarkedMap`.** Untested: custom objects with a `SerializationMark` like `MAudioTrack` (`simplifyMarkedObject` / `initializeObj` at 0%); `MarkedValue` / `MarkedArray` / `MarkedSet` round trips; a shared object comes back as one instance; errors for an unknown `kind` and for duplicate kinds in `consolidateMarks`.
4. [ ] **Small uncalled methods.** `MarkedSet.delete` / `replace` / `map`; `MarkedArray.sort` / `reverse` / `remove` (incl. not found); `MarkedValue.setDyn` / `replace`; `MarkedMap.map`; no-op paths (`add` of an existing item, `unshift()`, `pushAll([])`).

Not worth testing now: `DebugTree`, `util/` helpers, `copyWithin` (deliberately unimplemented), `isSimplifiable`.

## Decisions to revisit

- **Publishing the marked packages with the `mrkev:source` export condition.** Each package's `exports` has `"mrkev:source": "./index.ts"` so workspace packages resolve each other to source. `index.ts` isn't in the published files (`"files": ["dist"]`); that's harmless for consumers that don't set the condition, but before publishing, strip the entry (or override `exports` via `publishConfig`). Both packages are `"private": true` for now.
- **`SubbableMark.register` with the same child twice.** Containment is ref-counted, and `register` counts a child once per occurrence, so a struct whose two fields hold the same marked object counts it twice and swapping one field keeps it linked via the other. Because two fields holding the same marked object share state (eg, `new Clip(time, time)`), which is rarely intended, `register` also `console.warn`s whenever it leaves the holder containing a child more than once. That includes calling `register` twice with the same child (eg, from a base class and a subclass constructor). Revisit whether this should stay a warning, become an error, or be allowed silently once we see real usage.

## Suggested order

1. Fix the containment bugs above, with tests.
2. Design history for the marked packages (stable ids, restore-in-place); promote `historyStackFor` out of `exp/`.
3. Add the helper layer to cut boilerplate; port `DirtyObserver`.
4. Freeze structured-state as a reference.
