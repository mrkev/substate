import { describe, expect, it } from "vitest";
import { LinkableArray } from "./LinkableArray";

describe("LinkableArray", () => {
  it(".create", () => {
    const arr = LinkableArray.create();
    expect(arr).not.toBeNull();
  });

  it(".length", () => {
    const arr = LinkableArray.create(["foo", "bar", "foo"]);
    expect(arr.length).toEqual(3);
  });

  it(".indexOf", () => {
    const arr = LinkableArray.create(["foo", "bar", "foo"]);
    expect(arr.indexOf("foo")).toEqual(0);
    expect(arr.indexOf("bar")).toEqual(1);
    expect(arr.indexOf("baz")).toEqual(-1);
  });

  it(".push", () => {
    const arr = LinkableArray.create();
    arr.push("2");
    expect(arr.indexOf("2")).toBeGreaterThan(-1);
  });
});
