import { describe, expect, it } from "vitest";
import { MarkedArray } from "../MarkedArray";
import { MarkedValue } from "../MarkedValue";
import { subbable } from "./Subbable";
import { MarkedSubbable } from "./SubbableMark";

/** records every notification an object receives, as [changed, notified] */
function record(obj: MarkedSubbable) {
  const calls: [MarkedSubbable, MarkedSubbable][] = [];
  subbable.subscribe(obj, (changed, notified) =>
    calls.push([changed, notified]),
  );
  return calls;
}

describe("notification propagation", () => {
  it("a change notifies the object itself, with itself as the target", () => {
    const arr = MarkedArray.create<number>([]);
    const calls = record(arr);
    arr.push(1);
    expect(calls).toEqual([[arr, arr]]);
  });

  it("a deep change notifies every ancestor once, with the changed object as the target", () => {
    const leaf = MarkedValue.create(0);
    const mid = MarkedArray.create([leaf]);
    const top = MarkedArray.create([mid]);
    const leafCalls = record(leaf);
    const midCalls = record(mid);
    const topCalls = record(top);

    leaf.set(1);

    // `changed` is what changed (the leaf) at every level; `notified` is the
    // object subscribed to. useLink uses this to tell shallow from deep changes.
    expect(leafCalls).toEqual([[leaf, leaf]]);
    expect(midCalls).toEqual([[leaf, mid]]);
    expect(topCalls).toEqual([[leaf, top]]);
  });

  it("each notified object's hash goes up by one", () => {
    const leaf = MarkedValue.create(0);
    const mid = MarkedArray.create([leaf]);
    const top = MarkedArray.create([mid]);
    const before = [leaf, mid, top].map((o) => o.$$mark._hash);
    leaf.set(1);
    expect([leaf, mid, top].map((o) => o.$$mark._hash)).toEqual(
      before.map((h) => h + 1),
    );
  });

  it("a change doesn't notify objects below or beside it", () => {
    const leaf = MarkedValue.create(0);
    const sibling = MarkedValue.create(0);
    const parent = MarkedArray.create([leaf, sibling]);
    const leafCalls = record(leaf);
    const siblingCalls = record(sibling);

    parent.push(MarkedValue.create(0));

    expect(leafCalls).toEqual([]);
    expect(siblingCalls).toEqual([]);
  });

  it("a shared child reached through two paths notifies the top once", () => {
    // top holds left and right, which both hold the same leaf
    const leaf = MarkedValue.create(0);
    const left = MarkedArray.create([leaf]);
    const right = MarkedArray.create([leaf]);
    const top = MarkedArray.create([left, right]);
    const leftCalls = record(left);
    const rightCalls = record(right);
    const topCalls = record(top);

    leaf.set(1);

    expect(leftCalls).toEqual([[leaf, left]]);
    expect(rightCalls).toEqual([[leaf, right]]);
    expect(topCalls).toEqual([[leaf, top]]);
  });

  it("two objects containing each other are each notified once", () => {
    const a = MarkedArray.create<unknown>([]);
    const b = MarkedArray.create<unknown>([a]);
    a.push(b);
    const aCalls = record(a);
    const bCalls = record(b);

    b.push(1);

    expect(bCalls).toEqual([[b, b]]);
    expect(aCalls).toEqual([[b, a]]);
  });

  it("an object containing itself is notified once", () => {
    const a = MarkedArray.create<unknown>([]);
    a.push(a);
    const calls = record(a);
    a.push(1);
    expect(calls).toEqual([[a, a]]);
  });

  it("unsubscribing stops notifications", () => {
    const value = MarkedValue.create(0);
    let notified = 0;
    const unsubscribe = subbable.subscribe(value, () => notified++);
    value.set(1);
    unsubscribe();
    value.set(2);
    expect(notified).toBe(1);
  });

  it("a removed child no longer notifies its old parent", () => {
    const child = MarkedValue.create(0);
    const parent = MarkedArray.create([child]);
    parent.pop();
    const calls = record(parent);
    child.set(1);
    expect(calls).toEqual([]);
  });
});
