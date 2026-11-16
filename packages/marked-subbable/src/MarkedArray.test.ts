import { describe, expect, it, vi } from "vitest";
import { subbable } from "./lib/Subbable";
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

  describe(".shift", () => {
    it("removes and returns the first item", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      expect(arr.shift()).toBe(1);
      expect([...arr]).toEqual([2, 3]);
    });

    it("returns undefined and doesn't notify on an empty array", () => {
      const arr = MarkedArray.create<number>([]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      expect(arr.shift()).toBeUndefined();
      expect(cb).not.toHaveBeenCalled();
    });

    it("uncontains the removed item", () => {
      const child = MarkedValue.create(1);
      const arr = MarkedArray.create([child]);
      arr.shift();
      expect(child.$$mark._container.has(arr)).toBe(false);
    });
  });

  it("push() and unshift() with no items return the length", () => {
    const arr = MarkedArray.create([1, 2, 3]);
    expect(arr.push()).toBe(3);
    expect(arr.unshift()).toBe(3);
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

    describe("matches native Array.prototype.splice", () => {
      const cases: any[][] = [
        [],
        [1],
        [-1],
        [-10],
        [10],
        [NaN],
        [1, undefined],
        [1, 1],
        [1, -1],
        [1, Infinity],
        [1, 1.7],
        [1, 0, "x", "y"],
        [-2, 1, "x"],
      ];

      for (const args of cases) {
        it(`splice(${args.map(String).join(", ")})`, () => {
          const native = ["a", "b", "c", "d"];
          const marked = MarkedArray.create(["a", "b", "c", "d"]);
          const nativeDeleted = (native.splice as any)(...args);
          const markedDeleted = (marked.splice as any)(...args);
          expect(markedDeleted).toEqual(nativeDeleted);
          expect([...marked]).toEqual(native);
        });
      }
    });

    it("splice(start) removes to the end and uncontains removed items", () => {
      const a = MarkedValue.create("a");
      const b = MarkedValue.create("b");
      const c = MarkedValue.create("c");
      const arr = MarkedArray.create([a, b, c]);

      const deleted = arr.splice(1);

      expect(deleted).toEqual([b, c]);
      expect([...arr]).toEqual([a]);
      expect(a.$$mark._container.has(arr)).toBe(true);
      expect(b.$$mark._container.has(arr)).toBe(false);
      expect(c.$$mark._container.has(arr)).toBe(false);
    });

    it("replacing an item with itself keeps it contained", () => {
      const child = MarkedValue.create(1);
      const arr = MarkedArray.create([child]);
      arr.splice(0, 1, child);
      expect(child.$$mark._container.has(arr)).toBe(true);
    });

    describe("no-op splices don't notify", () => {
      const noops: [string, (arr: MarkedArray<number>) => void][] = [
        ["splice(0, 0)", (arr) => arr.splice(0, 0)],
        ["splice(length)", (arr) => arr.splice(arr.length)],
        ["splice(1, -1)", (arr) => arr.splice(1, -1)],
        ["splice(1, undefined)", (arr) => arr.splice(1, undefined)],
      ];

      for (const [name, op] of noops) {
        it(name, () => {
          const arr = MarkedArray.create([1, 2, 3]);
          const cb = vi.fn();
          subbable.subscribe(arr, cb);
          op(arr);
          expect(cb).not.toHaveBeenCalled();
          expect([...arr]).toEqual([1, 2, 3]);
        });
      }

      it("splice(0) on an empty array", () => {
        const arr = MarkedArray.create<number>([]);
        const cb = vi.fn();
        subbable.subscribe(arr, cb);
        arr.splice(0);
        expect(cb).not.toHaveBeenCalled();
      });
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

  describe(".fill", () => {
    it("fills the whole array by default", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      arr.fill(0);
      expect([...arr]).toEqual([0, 0, 0]);
    });

    it("fills a [start, end) range", () => {
      const arr = MarkedArray.create([1, 2, 3, 4]);
      arr.fill(9, 1, 3);
      expect([...arr]).toEqual([1, 9, 9, 4]);
    });

    it("supports negative start/end", () => {
      const arr = MarkedArray.create([1, 2, 3, 4]);
      arr.fill(9, -3, -1);
      expect([...arr]).toEqual([1, 9, 9, 4]);
    });

    it("returns the array itself", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      expect(arr.fill(0)).toBe(arr);
    });

    describe("containment", () => {
      it("contains the fill value", () => {
        const arr = MarkedArray.create<MarkedValue<number>>([
          MarkedValue.create(1),
          MarkedValue.create(2),
        ]);
        const value = MarkedValue.create(0);
        arr.fill(value);
        expect(value.$$mark._container.has(arr)).toBe(true);
      });

      it("uncontains overwritten items", () => {
        const a = MarkedValue.create("a");
        const b = MarkedValue.create("b");
        const c = MarkedValue.create("c");
        const arr = MarkedArray.create([a, b, c]);
        const value = MarkedValue.create("x");

        arr.fill(value, 1, 3);

        expect(a.$$mark._container.has(arr)).toBe(true); // untouched
        expect(b.$$mark._container.has(arr)).toBe(false); // overwritten
        expect(c.$$mark._container.has(arr)).toBe(false); // overwritten
        expect(value.$$mark._container.has(arr)).toBe(true);
      });

      it("keeps an overwritten item contained if it survives elsewhere", () => {
        const dup = MarkedValue.create("dup");
        const arr = MarkedArray.create([dup, MarkedValue.create("b"), dup]);
        const value = MarkedValue.create("x");

        // overwrite index 1 only; `dup` still lives at indices 0 and 2
        arr.fill(value, 1, 2);

        expect(dup.$$mark._container.has(arr)).toBe(true);
        expect(value.$$mark._container.has(arr)).toBe(true);
      });

      it("keeps the fill value contained even when it was overwritten", () => {
        const value = MarkedValue.create("x");
        const arr = MarkedArray.create([value, MarkedValue.create("b")]);

        // value is both an existing element (index 0) and the fill value
        arr.fill(value);

        expect(value.$$mark._container.has(arr)).toBe(true);
      });
    });

    it("notifies subscribers exactly once and bumps the hash", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      const before = arr.$$mark._hash;
      arr.fill(0);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(arr.$$mark._hash).toBe(before + 1);
    });

    it("is a no-op for an empty range and does not notify", () => {
      const arr = MarkedArray.create([1, 2, 3]);
      const cb = vi.fn();
      subbable.subscribe(arr, cb);
      const before = arr.$$mark._hash;
      arr.fill(0, 2, 2);
      expect([...arr]).toEqual([1, 2, 3]);
      expect(cb).not.toHaveBeenCalled();
      expect(arr.$$mark._hash).toBe(before);
    });
  });
});
