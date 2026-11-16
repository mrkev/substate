import { describe, expect, it } from "vitest";
import { subbable } from "./lib/Subbable";
import { MarkedSet } from "./MarkedSet";
import { MarkedValue } from "./MarkedValue";

describe("MarkedSet", () => {
  it(".create", () => {
    const set = MarkedSet.create();
    expect(set).not.toBeNull();
  });

  it(".size", () => {
    const set = MarkedSet.create(["foo", "bar", "foo"]);
    expect(set.size).toEqual(2);
  });

  it(".has", () => {
    const set = MarkedSet.create(["foo", "bar", "foo"]);
    expect(set.has("foo")).toEqual(true);
    expect(set.has("bar")).toEqual(true);
    expect(set.has("baz")).toEqual(false);
  });

  it(".add", () => {
    const set = MarkedSet.create();
    set.add("2");
    expect(set.has("2")).toEqual(true);
  });

  it(".clear unlinks elements", () => {
    const a = MarkedValue.create("a");
    const set = MarkedSet.create([a]);
    expect(a.$$mark._container.has(set)).toBe(true);
    set.clear();
    expect(set.size).toBe(0);
    expect(a.$$mark._container.has(set)).toBe(false);
  });

  it(".clear on an empty set doesn't notify", () => {
    const set = MarkedSet.create();
    let notified = 0;
    subbable.subscribe(set, () => notified++);
    set.clear();
    expect(notified).toBe(0);
  });

  describe(".delete", () => {
    it("removes the item, unlinks it and notifies once", () => {
      const a = MarkedValue.create("a");
      const set = MarkedSet.create([a]);
      let notified = 0;
      subbable.subscribe(set, () => notified++);
      expect(set.delete(a)).toBe(true);
      expect(set.has(a)).toBe(false);
      expect(a.$$mark._container.has(set)).toBe(false);
      expect(notified).toBe(1);
    });

    it("returns false and doesn't notify for a missing item", () => {
      const set = MarkedSet.create(["a"]);
      let notified = 0;
      subbable.subscribe(set, () => notified++);
      expect(set.delete("b")).toBe(false);
      expect(notified).toBe(0);
    });
  });

  it(".add of an existing item doesn't notify", () => {
    const set = MarkedSet.create(["a"]);
    let notified = 0;
    subbable.subscribe(set, () => notified++);
    set.add("a");
    expect(set.size).toBe(1);
    expect(notified).toBe(0);
  });

  it(".replace swaps the contents, relinks items and notifies once", () => {
    const kept = MarkedValue.create("kept");
    const removed = MarkedValue.create("removed");
    const added = MarkedValue.create("added");
    const set = MarkedSet.create([kept, removed]);
    let notified = 0;
    subbable.subscribe(set, () => notified++);

    set.replace(new Set([kept, added]));

    expect([...set]).toEqual([kept, added]);
    expect(kept.$$mark._container.get(set)).toBe(1);
    expect(removed.$$mark._container.has(set)).toBe(false);
    expect(added.$$mark._container.get(set)).toBe(1);
    expect(notified).toBe(1);
  });

  it(".map returns an array of the mapped items", () => {
    expect(MarkedSet.create([1, 2]).map((x) => x * 10)).toEqual([10, 20]);
  });
});
