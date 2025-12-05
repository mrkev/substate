import { describe, expect, it } from "vitest";
import { MarkedSet } from "./MarkedSet";

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
});
