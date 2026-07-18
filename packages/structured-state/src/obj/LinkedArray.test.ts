import { describe, expect, it, vi } from "vitest";
// Import the package entry first so the module graph loads in an order where
// LinkedArray is defined before SSchemaArray (which extends it) is evaluated.
// Importing ./LinkedArray directly as the entry point hits a circular-import error.
import "..";
import { subscribe } from "../state/Subbable";
import { LinkedArray } from "./LinkedArray";

describe("SArray", () => {
  it(".of", () => {
    const arr = LinkedArray.create();
    expect(arr).not.toBeNull();
  });

  it(".at", () => {
    const arr = LinkedArray.create(["foo", "bar"]);
    expect(arr.at(0)).toEqual("foo");
  });

  it(".push", () => {
    const arr = LinkedArray.create();
    arr.push("1", "2");
    expect(arr.at(1)).toEqual("2");
  });

  describe(".pushAll", () => {
    it("appends every item in order and returns the new length", () => {
      const arr = LinkedArray.create([1, 2]);
      const len = arr.pushAll([3, 4, 5]);
      expect(len).toBe(5);
      expect([...arr]).toEqual([1, 2, 3, 4, 5]);
    });

    it("appends onto an empty array", () => {
      const arr = LinkedArray.create<number>();
      expect(arr.pushAll([1, 2, 3])).toBe(3);
      expect([...arr]).toEqual([1, 2, 3]);
    });

    it("notifies subscribers exactly once", () => {
      const arr = LinkedArray.create<number>();
      const cb = vi.fn();
      subscribe(arr, cb);
      const before = arr._hash;
      arr.pushAll([1, 2, 3]);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(arr._hash).toBe(before + 1);
    });

    it("is a no-op for an empty list of items", () => {
      const arr = LinkedArray.create([1, 2]);
      const cb = vi.fn();
      subscribe(arr, cb);
      const before = arr._hash;
      expect(arr.pushAll([])).toBe(2);
      expect([...arr]).toEqual([1, 2]);
      expect(cb).not.toHaveBeenCalled();
      expect(arr._hash).toBe(before);
    });
  });
});
