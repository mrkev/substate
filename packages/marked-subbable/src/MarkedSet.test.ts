import { describe, expect, it } from "vitest";
import { subbable } from "./lib/Subbable";
import { MarkedSet } from "./MarkedSet";
import { MarkedValue } from "./MarkedValue";

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

  it(".clear unlinks elements", () => {
    const a = MarkedValue.create("a");
    const set = MarkedSet.create([a]);
    expect(a.$$mark._container.has(set)).toBe(true);
    set.clear();
    expect(set.size).toBe(0);
    expect(a.$$mark._container.has(set)).toBe(false);
  });

  it(".clear on an empty set doesn't notify", () => {
    const set = MarkedSet.create();
    let notified = 0;
    subbable.subscribe(set, () => notified++);
    set.clear();
    expect(notified).toBe(0);
  });
});
