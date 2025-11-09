import { describe, expect, it } from "vitest";
import { LinkedSet } from "./LinkedSet";

describe("LinkedSet", () => {
  it(".create", () => {
    const set = LinkedSet.create();
    expect(set).not.toBeNull();
  });

  it(".size", () => {
    const set = LinkedSet.create(["foo", "bar", "foo"]);
    expect(set.size).toEqual(2);
  });

  it(".has", () => {
    const set = LinkedSet.create(["foo", "bar", "foo"]);
    expect(set.has("foo")).toEqual(true);
    expect(set.has("bar")).toEqual(true);
    expect(set.has("baz")).toEqual(false);
  });

  it(".add", () => {
    const set = LinkedSet.create();
    set.add("2");
    expect(set.has("2")).toEqual(true);
  });
});
