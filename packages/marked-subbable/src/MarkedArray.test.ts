import { describe, expect, it, vi } from "vitest";
import { subbable } from "../lib/Subbable";
import { MarkedArray } from "./MarkedArray";
import { MarkedValue } from "./MarkedValue";

describe("MarkedArray", () => {
  it(".create", () => {
    const arr = MarkedArray.create();
    expect(arr).not.toBeNull();
  });

  it(".length", () => {
    const arr = MarkedArray.create(["foo", "bar", "foo"]);
    expect(arr.length).toEqual(3);
  });

  it(".indexOf", () => {
    const arr = MarkedArray.create(["foo", "bar", "foo"]);
    expect(arr.indexOf("foo")).toEqual(0);
    expect(arr.indexOf("bar")).toEqual(1);
    expect(arr.indexOf("baz")).toEqual(-1);
  });

  it(".push", () => {
    const arr = MarkedArray.create();
    arr.push("2");
    expect(arr.indexOf("2")).toBeGreaterThan(-1);
  });

  it(".pop", () => {
    const arr = MarkedArray.create([1, 2, 3]);
    expect(arr.pop()).toBe(3);
    expect(arr.length).toBe(2);
  });

  describe(".pushAll", () => {
    it("appends every item in order and returns the new length", () => {
      const arr = MarkedArray.create([1, 2]);
      const len = arr.pushAll([3, 4, 5]);
      expect(len).toBe(5);
      expect([...arr]).toEqual([1, 2, 3, 4, 5]);
    });

    it("appends onto an empty array", () => {
      const arr = MarkedArray.create<number>([]);
      expect(arr.pushAll([1, 2, 3])).toBe(3);
      expect([...arr]).toEqual([1, 2, 3]);
    });

    it("notifies subscribers exactly once", () => {
      const arr = MarkedArray.create<number>([]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      const before = arr.$$mark._hash;
      arr.pushAll([1, 2, 3]);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(arr.$$mark._hash).toBe(before + 1);
    });

    it("is a no-op for an empty list of items", () => {
      const arr = MarkedArray.create([1, 2]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      const before = arr.$$mark._hash;
      expect(arr.pushAll([])).toBe(2);
      expect([...arr]).toEqual([1, 2]);
      expect(cb).not.toHaveBeenCalled();
      expect(arr.$$mark._hash).toBe(before);
    });
  });

  describe(".splice", () => {
    it("removes and returns the deleted items", () => {
      const arr = MarkedArray.create([1, 2, 3, 4]);
      const deleted = arr.splice(1, 2);
      expect(deleted).toEqual([2, 3]);
      expect([...arr]).toEqual([1, 4]);
    });

    it("inserts new items in place", () => {
      const arr = MarkedArray.create([1, 4]);
      const deleted = arr.splice(1, 0, 2, 3);
      expect(deleted).toEqual([]);
      expect([...arr]).toEqual([1, 2, 3, 4]);
    });

    it("returns a plain Array, not a MarkedArray", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      const deleted = arr.splice(0, 1);
      expect(deleted).toBeInstanceOf(Array);
      expect(deleted).not.toBeInstanceOf(MarkedArray);
    });

    describe("containment", () => {
      it("contains inserted containable items", () => {
        const arr = MarkedArray.create<MarkedValue<number>>([]);
        const child = MarkedValue.create(1);
        arr.splice(0, 0, child);
        expect(child.$$mark._container.has(arr)).toBe(true);
      });

      it("uncontains removed containable items", () => {
        const child = MarkedValue.create(1);
        const arr = MarkedArray.create([child]);
        // constructing the array should have contained the child
        expect(child.$$mark._container.has(arr)).toBe(true);

        arr.splice(0, 1);
        expect(child.$$mark._container.has(arr)).toBe(false);
      });

      it("uncontains removed and contains inserted in a single splice", () => {
        const oldChild = MarkedValue.create("old");
        const newChild = MarkedValue.create("new");
        const arr = MarkedArray.create([oldChild]);

        const deleted = arr.splice(0, 1, newChild);

        expect(deleted).toEqual([oldChild]);
        expect(oldChild.$$mark._container.has(arr)).toBe(false);
        expect(newChild.$$mark._container.has(arr)).toBe(true);
      });

      it("leaves untouched containable items contained", () => {
        const kept = MarkedValue.create("kept");
        const removed = MarkedValue.create("removed");
        const arr = MarkedArray.create([kept, removed]);

        arr.splice(1, 1);

        expect(kept.$$mark._container.has(arr)).toBe(true);
        expect(removed.$$mark._container.has(arr)).toBe(false);
      });

      it("ignores non-containable items", () => {
        const arr = MarkedArray.create([1, 2, 3]);
        expect(() => arr.splice(1, 1, 9)).not.toThrow();
        expect([...arr]).toEqual([1, 9, 3]);
      });
    });

    it("notifies subscribers exactly once and bumps the hash", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      const before = arr.$$mark._hash;
      arr.splice(1, 1, 9);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(arr.$$mark._hash).toBe(before + 1);
    });

    it("propagates a change notification to the parent container", () => {
      const child = MarkedArray.create([1, 2, 3]);
      const parent = MarkedArray.create([child]);
      const cb = vi.fn();
      subbable.subscribe(parent, cb);

      child.splice(0, 1);

      // parent is notified that `child` changed
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(child, parent);
    });
  });
});
