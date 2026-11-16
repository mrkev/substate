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

- [ ] **Map deserialization is broken.** `initializeMarkedMap` uses `.map((key, value) => …)` but the callback receives `(entry, index)` (`packages/marked-serializable/src/construct.ts`).
- [ ] **`simplify` doesn't check for already-visited nodes** before recursing (`packages/marked-serializable/src/simplify.ts`). Cycles recurse forever; shared subtrees are re-serialized on every visit. Recording the node before recursing fixes both.
- [ ] **Direct index writes skip notifications.** Because `MarkedArray` extends `Array`, `arr[i] = x` and `arr.length = 0` mutate without notifying. Since containment is ref-counted, direct writes also leave the counts wrong. Document it or wrap in a Proxy.

## TypeScript and build setup

Covers `marked-subbable`, `marked-serializable` and `structured-state`. Already fine: `strict`, `noImplicitOverride`, `isolatedModules` and `moduleResolution: "bundler"` everywhere; test files are type-checked; `pnpm tsc` (`tsc -b`) reaches every package via the root references; `dist/` and `*.tsbuildinfo` are gitignored.

Done: workspace packages now resolve each other to source via an `mrkev:source` export condition (`marked-subbable` and `marked-serializable` `package.json` exports, `customConditions` in `marked-serializable` and site tsconfigs, `resolve.conditions` in the site's vite config). `structured-state`'s `exports` also has the condition (pointing at `./src/index.ts`), for if the site ever imports it by package name; today the site imports it by relative path into `src/`, and doesn't list it as a dependency. `@mrkev/linked-state` (old code) still resolves to its `dist/`. Add the condition to a vitest config once `marked-serializable` has tests. Before publishing either marked package: the source condition points at `./index.ts`, which isn't in the published files (`"files": ["dist"]`). Harmless for consumers that don't set the condition, but strip the entry before publishing (or override `exports` via `publishConfig`). Both packages are `"private": true` for now.

Done: the marked packages' `build` is now `tsc -b && vite build`, so type errors fail it (`vite-plugin-dts` doesn't fail on them by default), and their `dts({ ... })` options exclude `*.test.ts(x)`, so test declarations aren't published. `structured-state` already type-checked in its build; its `dts` options now also exclude tests (`*.test.ts(x)`, `src/__tests__/`, and the test-only `src/testUtils.ts`).

Done: `structured-state`'s `main` / `exports` no longer point at a `structured-state.umd.cjs` that was never built (only `formats: ["es"]` is built); `main` is now the ES file and the `require` entry is gone. Cleanups: tsconfig `include`s are just `["src", "./index.ts"]` in both marked packages (dropped nonexistent and redundant folders), and the unused dev dependencies (`marked-subbable` on itself, `structured-state` on `@mrkev/linked-state`) are removed. `pnpm install` also dropped a stale root `@types/scheduler` lockfile entry, left over from `9e8e218` removing it from `package.json`.

Done: compiler options live in two shared files at the root, which every package extends: `tsconfig.base.json` (each `tsconfig.src.json`, the browser code; includes `customConditions`) and `tsconfig.node.base.json` (each `tsconfig.node.json`, which checks `vite.config.ts` and needs Node's types). Package configs only set `include`, since inherited paths resolve relative to the base file. The root `tsconfig.json` is now just the project list for `pnpm tsc`. Effective settings are unchanged except `customConditions` in every package and `strict` for the `vite.config.ts` checks.

Done: `engines` is `>=22` in both marked packages (Node 18 and 20 are end-of-life). `MarkedArray.fromAsync` needs Node 22+; the only other newer API they use is `Array.prototype.at` (ES2022). `engines` only covers Node; browser support follows the same APIs (roughly Chrome 121, Safari 16.4, Firefox 115 because of `fromAsync`). `linked-state` (old code) still says `>=18`.

Note: the per-package `tsconfig.json` files have `"files": []` and only reference `tsconfig.src.json` / `tsconfig.node.json`, so `tsc -p packages/<pkg>` checks nothing. Use `pnpm tsc` (or `tsc -p packages/<pkg>/tsconfig.src.json`).

1. [ ] **`pnpm lint` fails on `main`.** 2 errors and 5 warnings, all in site files: `react-hooks/set-state-in-effect` errors in `site/src/ui/TrackA.tsx` and `site/src/unused/Simple.tsx`, plus `react-refresh/only-export-components` warnings in `site/src/ls/LinkedStateDebug.tsx`, `site/src/unused/Api1.tsx` and `Simple.tsx`. Not caused by the marked packages.


## Decisions to revisit

- **`SubbableMark.register` with the same child twice.** Containment is ref-counted, and `register` counts a child once per occurrence, so a struct whose two fields hold the same marked object counts it twice and swapping one field keeps it linked via the other. Because two fields holding the same marked object share state (eg, `new Clip(time, time)`), which is rarely intended, `register` also `console.warn`s whenever it leaves the holder containing a child more than once. That includes calling `register` twice with the same child (eg, from a base class and a subclass constructor). Revisit whether this should stay a warning, become an error, or be allowed silently once we see real usage.

## Suggested order

1. Fix the containment bugs above, with tests.
2. Design history for the marked packages (stable ids, restore-in-place); promote `historyStackFor` out of `exp/`.
3. Add the helper layer to cut boilerplate; port `DirtyObserver`.
4. Freeze structured-state as a reference.
