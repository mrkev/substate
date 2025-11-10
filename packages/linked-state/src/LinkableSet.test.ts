import { describe, expect, it } from "vitest";
import { LinkableSet } from "./LinkableSet";

describe("LinkableSet", () => {
  it(".create", () => {
    const set = LinkableSet.create();
    expect(set).not.toBeNull();
  });

  it(".size", () => {
    const set = LinkableSet.create(["foo", "bar", "foo"]);
    expect(set.size).toEqual(2);
  });

  it(".has", () => {
    const set = LinkableSet.create(["foo", "bar", "foo"]);
    expect(set.has("foo")).toEqual(true);
    expect(set.has("bar")).toEqual(true);
    expect(set.has("baz")).toEqual(false);
  });

  it(".add", () => {
    const set = LinkableSet.create();
    set.add("2");
    expect(set.has("2")).toEqual(true);
  });
});
