import { describe, expect, it } from "vitest";
import { MarkedMap } from "./MarkedMap";

describe("MarkedMap", () => {
  it(".create", () => {
    const map = MarkedMap.create();
    expect(map).not.toBeNull();
  });

  it(".get", () => {
    const map = MarkedMap.create([["foo", "bar"]]);
    expect(map.get("foo")).toEqual("bar");
  });

  it(".set", () => {
    const map = MarkedMap.create();
    map.set("2", "2");
    expect(map.get("2")).toEqual("2");
  });
});
