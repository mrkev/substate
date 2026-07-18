import { describe, expect, it, vi } from "vitest";
import { subbable } from "../lib/Subbable";
import { MarkedArray } from "./MarkedArray";

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
});
