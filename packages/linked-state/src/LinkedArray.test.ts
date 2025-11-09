import { describe, expect, it } from "vitest";
import { LinkedArray } from "./LinkedArray";

describe("LinkedArray", () => {
  it(".create", () => {
    const arr = LinkedArray.create();
    expect(arr).not.toBeNull();
  });

  it(".length", () => {
    const arr = LinkedArray.create(["foo", "bar", "foo"]);
    expect(arr.length).toEqual(3);
  });

  it(".indexOf", () => {
    const arr = LinkedArray.create(["foo", "bar", "foo"]);
    expect(arr.indexOf("foo")).toEqual(0);
    expect(arr.indexOf("bar")).toEqual(1);
    expect(arr.indexOf("baz")).toEqual(-1);
  });

  it(".push", () => {
    const arr = LinkedArray.create();
    arr.push("2");
    expect(arr.indexOf("2")).toBeGreaterThan(-1);
  });
});
