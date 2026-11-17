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
- **History / undo.** The real gap. structured-state's undo restores old state _into existing objects_ (components holding references stay valid), which relies on stable ids. `constructSimplifiedPackage` only builds new objects with new ids, so an id-keyed history stack can't map back to live objects. Decide on restore-in-place and id stability across save/load next. `site/src/marked/exp/historyStackFor.tsx` is the starting point.
- `DirtyObserver` (easy port), unions, schema validation.

## Stable ids (for history)

History needs to match a saved snapshot back to the live object it came from, by id. Today that doesn't work:

- **Loading assigns new ids.** Every object rebuilt by `constructSimplifiedPackage` gets a fresh random id, so ids don't survive a save and load.
- **Id collisions silently lose data.** Saving keys references by `$$mark._id`. If two different objects share an id, the second is saved as a reference to the first and comes back with the first's contents (confirmed with a probe). Ids are 5-character `nanoid`s; the chance that some pair of live objects shares one is 0.05% with 1,000 objects, 4.6% with 10,000, and 69% with 50,000.

### How structured-state handles ids

- **Assigning ids.** Built-ins (`LinkedPrimitive`, `LinkedArray`, `SSet`, `SSchemaArray`, `SUnion`) take the id as a constructor parameter: `create()` passes a random `nanoid(5)`, the loader passes the saved id. Structs (`Struct`, `Struct2`, `Structured`) generate a random id in their constructor and the loader overwrites it (`instance._id = json._id`, `overrideId`), before the object registers itself so the temporary id is never registered.
- **`knownObjects`.** A global map from id to `WeakRef`, written by constructors. Its only reads are in history (`sstate.history.tsx`): undo and redo look up each recorded id's live object to `replacePackage` the snapshot into it, and both first snapshot those same objects' current state to build the opposite entry. Without it, each lookup would walk the state tree from a root.
- **No duplicate detection.** Ids are never checked against `knownObjects`, and `WeakRefMap.set` overwrites, so a collision replaces the registry entry, and undo then restores one object's snapshot into a different object. `LinkedMap` never registers, and dead entries are only cleaned up every 10,000 writes.

### Registry options

Restore-in-place needs id → live object for any object a snapshot mentions, not just the ones that changed: a parent's snapshot refers to its children by id, and restoring it should reuse live children (so components holding them keep working) and rebuild missing ones with their saved ids.

- **A. Checked global registry (leaning this way).** id → `WeakRef`, plus a `FinalizationRegistry` to drop entries after garbage collection. Generated ids retry on a clash, explicit duplicate ids throw (all marks are created through `SubbableMark`'s constructor, so one check covers everything), and loading can detect saved ids that are already live. Guarantees no two live objects share an id, and doubles as history's lookup. Costs about 0.4 µs and 180 bytes per object on top of a bare object (measured: 0.12 → 0.49 µs, 78 → 255 bytes), and brings back global state, kept to id → `WeakRef` only.
- **B. No registry.** Longer ids make collisions practically impossible, collision-safe saving covers the rest (ref keys per object, eg `abc12~2` with an `"id"` field on collision), loading only catches duplicates within one file, and history keeps its own lookup of objects reachable from its root. No per-object cost or global state, but no guarantee.

### Plan, step by step

1. [ ] **Let the loader assign ids.** Built-ins already take the id as a private constructor parameter; custom objects create their mark in a field initializer (`SubbableMark.create()`, always random) and the loader only calls `construct(description)`. Open decision between:
   - **Set it after building.** An internal `SubbableMark._setId(id)` the loader calls on every object it builds; one place, every kind, no changes to user code. But every loaded object briefly has a random id (with a registry, registered then moved), code running during construction sees that id, and ids become changeable after creation (`_setId` must be public for `marked-serializable` to call it).
   - **Pass it in.** `create(items, { id })` for built-ins and `construct(description, { id })` forwarded by each class to `SubbableMark.create(id)`. Objects are born with their final id and ids never change, but every custom class must forward it (the loader checks `instance.$$mark._id === id`) and carries more boilerplate.
   - **Split, as structured-state does.** Built-ins created with their id (`create(items, { id })`); custom objects through `_setId` after `construct` (structured-state's `initialize.ts`: built-ins via constructors, `Struct` / `Struct2` / `Structured` via `instance._id = …` / `overrideId`).
   - **Pending id (idea to keep).** The loader sets a pending id right before calling `construct`, and only `SubbableMark.create()` (a custom object's own mark) takes it; the built-in factories (`mArray`, `mMap`, `mSet`, `mValue`) always generate their own id, and the loader gives built-ins their saved id explicitly. A single slot is enough (the loader builds children before parents, so nothing nests). Every object is born with its final id and ids never change, with no changes to user code. Remaining hazard: a custom object created before the one being loaded takes its id (a `construct` calling `MTime.of(...)` before `new`, a custom-object field declared above `$$mark`, a base-class constructor creating custom objects). Guards: clear the pending id in a `finally`, and check the id after `construct` (eg "construct for 'mclip' created another marked object before its own $$mark"), so a misassigned id always fails loudly.
2. [ ] **Registry.** Option A or B above. Open decision.
3. [ ] **Longer ids.** 12 characters (about 1 in 10 billion odds of any collision with a million objects; 7 more characters per id in the JSON) or `nanoid`'s default 21. Open decision.
4. [ ] **Saving handles collisions.** With A, a collision can only come from a bug (eg two copies of `marked-subbable` loaded), so saving throws. With B, collision-safe saving as described above. Either way, cycle detection moves from ids to objects (with ids, a collision could look like a cycle).
5. [ ] **Loading keeps saved ids.** Using step 1. Default: keep ids, so opening a project gives the same ids every time. `constructSimplifiedPackage(pkg, index, { ids: "new" })` for copies (duplicate, paste). With A, loading an id that's already live fails or falls back to new ids.
6. [ ] **Later, with history: restore into existing objects.** The loader reuses live objects (looked up through the registry with A, or the history stack's own lookup with B) instead of building new ones; history updates their contents in place.

Related history issue: the experiment (`site/src/marked/exp/historyStackFor.tsx`) snapshots in a change notification, which fires after the change, so it records the new state, not the old one. Undo needs a hook before a mutation (`SubbableMark.mutate` has a commented-out `// saveForHistory(this);` in that spot).

Tests: ids survive save and load for every kind (incl. nested and shared objects); `{ ids: "new" }` gives fresh ids; collisions are caught (A: on creation and save; B: both objects survive a save and load); a collision doesn't look like a cycle; new ids have the new length.

## Decisions to revisit

- **Direct index writes on `MarkedArray`.** `arr[i] = x`, `delete arr[i]` and `arr.length = n` skip notifications and linking. This is documented (marked-subbable README, `MarkedArray` doc comment) with `splice` as the replacement. Making them work would mean returning a `Proxy` from the constructor to intercept index and `length` writes, at a cost on every index read.
- **Cycles in serialization.** Saving a cycle (an object that indirectly contains itself) throws `can't serialize a cycle: …`, and loading a cyclic package throws `can't load a cycle: …`, because `constructSimplifiedPackage` builds each object only after its children. Shared objects (no cycle) work and are serialized once. Supporting cycles would mean loading in two phases: create empty containers, register them, then fill them. That works for `MarkedArray` / `MarkedMap` / `MarkedSet` / `MarkedValue`, but custom objects' `construct(description)` needs its children first, so they'd need a `SerializationMark` API change. Overlaps with history's restore-in-place.
- **Publishing the marked packages with the `mrkev:source` export condition.** Each package's `exports` has `"mrkev:source": "./index.ts"` so workspace packages resolve each other to source. `index.ts` isn't in the published files (`"files": ["dist"]`); that's harmless for consumers that don't set the condition, but before publishing, strip the entry (or override `exports` via `publishConfig`). Both packages are `"private": true` for now.
- **`SubbableMark.register` with the same child twice.** Containment is ref-counted, and `register` counts a child once per occurrence, so a struct whose two fields hold the same marked object counts it twice and swapping one field keeps it linked via the other. Because two fields holding the same marked object share state (eg, `new Clip(time, time)`), which is rarely intended, `register` also `console.warn`s whenever it leaves the holder containing a child more than once. That includes calling `register` twice with the same child (eg, from a base class and a subclass constructor). Revisit whether this should stay a warning, become an error, or be allowed silently once we see real usage.

## Suggested order

1. Fix the containment bugs above, with tests.
2. Design history for the marked packages (stable ids, restore-in-place); promote `historyStackFor` out of `exp/`.
3. Add the helper layer to cut boilerplate; port `DirtyObserver`.
4. Freeze structured-state as a reference.
