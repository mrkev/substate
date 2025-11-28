import { describe, expect, it } from "vitest";
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
});
