# site: plan

Personal test bench for the state libraries. Not public docs. All four live
libraries matter: structured-state, linked-state, marked-subbable,
marked-serializable.

Scope for now: **light changes**. Keep it easy to tinker in; no big
restructuring, no new abstractions shared across libraries yet.

## 1. Quick fixes

- [ ] `ls/LinkableMapTest.tsx`: heading says "LinkedArray Tester", should be
      "LinkedMap Tester".
- [ ] `ls/LinkedStateDebug.tsx`: remove `console.log("RENDER", map)` in
      `DebugOutMap` (fires on every render).
- [ ] `App.tsx`: stop rendering `<SchedulerTest />` from `unused/` on the
      structured-state page.
- [ ] `marked/MarkedProjectTest.tsx`: undo calls `history.pop()`, which only
      logs. Label the button so it's obvious it's WIP (e.g. "undo (wip)") rather
      than implementing it now.
- [ ] "construct test" buttons (structured-state + marked): besides logging,
      show a pass/fail next to the button by comparing
      `serialize(constructed)` with `serialize(original)`.

## 2. Look and feel

- [x] `index.css`: drop the Vite starter rules (centered `#root` text, 3.2em
      `h1`, gray buttons, link colors). Replace with a small base layer:
      dark background, left-aligned text, one simple button style, monospace
      for tree/debug output.
- [x] Nav (`main.tsx`): switch `<a>` to `NavLink` so the current page is
      highlighted. Group by library:
      `structured-state` · `linked-state: basic | nested` ·
      `marked: basic | project`.
- [x] Each page gets a one-line description at the top saying what it
      exercises (e.g. "/ls2: nested map of arrays; todo list shows shallow vs
      recursive `useLink`").
- [x] A tiny `Panel` component (title + box) to replace the ad-hoc
      `fieldset` + inline `#181818` backgrounds and the
      `rounded-sm bg-gray-700/10 p-4` cards, so pages look consistent.
- [x] `index.html`: tab title "substate", drop the Vite favicon.

## 3. Re-render highlighting

The libraries' main claim is fine-grained updates (shallow vs deep), but the
site never shows which components re-rendered.

- [x] Add a `useRenderFlash()` hook (or `<RenderCount />` badge) that counts
      commits in a `useEffect` (so StrictMode's double render doesn't double
      the count) and briefly flashes an outline on the component.
- [x] Use it in the tester components (`ls/*Test.tsx`, `marked/*Test.tsx`,
      `MarkedCollection`), `ListSummary`/`ListItem` on `/ls2`, and
      `TrackA`/`ClipA` on both project pages.
- [x] A toggle in the nav to turn highlighting on/off.

## 4. Cheap cleanup

- [ ] Remove unused dependencies: `mobx`, `mobx-react-lite`,
      `mobx-state-tree` (only used by `unused/MobX.tsx`), `react-json-pretty`,
      `react-json-tree`, `react-json-view-lite` (only their CSS is imported in
      `main.tsx`). Keep the highlight.js stylesheet: the debug views use its
      `hljs-*` classes for colors.
- [ ] Delete `unused/` once nothing imports it? **Ask first.**

## Not now (maybe later)

- One shared tree viewer for all libraries (there are ~3 near-copies:
  `LinkedStateDebug`, `MarkedSetTest`, `JSONView`).
- Side-by-side comparison of the same project model across libraries.
- Actually implementing undo in `marked/exp/historyStackFor.tsx`.
- Importing through package names instead of `../../../structured-state/src/...`
  (some imports reach internals like `sstate.history` and `lib/WeakRefMap`
  that the packages don't export).
- Deduplicating `ui/TrackA.tsx` and the copy in `MarkedProjectTest.tsx`.

## Verification

After each section: `pnpm tsc`, `pnpm lint`, `pnpm build`, then run
`pnpm dev` and click through all five pages.
